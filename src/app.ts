import express from 'express';
import { data, IBlazeRecentData } from './data';
import fs from 'fs';

const xl = require('excel4node');
const fetch = require('node-fetch');

const wb = new xl.Workbook();
const ws = wb.addWorksheet('Resultados Blaze');

const app = express();
const port = process.env.PORT || 3000;

getResults();
saveResultsAsXlsFile();
setInterval(() => {
  getResults();
  saveResultsAsXlsFile();
}, 30000);

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.get('/baixar', (req, res) => {
  const file = './data.xlsx';
  res.download(file);
});

app.listen(process.env.PORT || 3000, function(){
  console.log("Express server listening on port %d in %s mode", this.address().port, app.settings.env);
});


async function getResults() {

  console.log("Buscando resultados...")
  const response = await fetch('https://blaze.com/api/roulette_games/recent');
  const result: IBlazeRecentData[] = await response.json();

  const splitedResult: IBlazeRecentData[] = splitResult(data, result);

  data.unshift(...splitedResult);

  fs.writeFile("data.json", JSON.stringify(data), function (err) {
    if (err) throw err;
    console.log('complete');
  }
  );
}

function splitResult(data: IBlazeRecentData[], newData: IBlazeRecentData[]): IBlazeRecentData[] {

  let result: IBlazeRecentData[] = [];
  let isElementFound = false;

  const lastData10Elements: IBlazeRecentData[] = data.slice(0, 20);

  if (data.length >= 20) {
    lastData10Elements.forEach((dataElement: IBlazeRecentData) => {
      if (!isElementFound) {
        newData.forEach((newDataElement: IBlazeRecentData, index: number) => {
          if (newDataElement.id == dataElement.id) {
            result = newData.splice(0, index);
            isElementFound = true;
            console.log(`se encontraron ${result.length} nuevos resultados`);
          }
        })
      }
    })
  } else {
    result = [...newData];
  }

  return result;
}

function saveResultsAsXlsFile() {

  console.log("Creando archivo excel");

  let formattedData = [];

  data.forEach((instance, indexx, record) => {
    const tempArryEl = {
      'Data': record[indexx].created_at,
      'Cor': record[indexx].color.toString(),
      'Número': record[indexx].roll.toString()
    }
    formattedData.push(tempArryEl);
  });

  const headingColumnNames = [
    "Data",
    "Cor",
    "Número",
  ]
  //Write Column Title in Excel file
  let headingColumnIndex = 1;
  headingColumnNames.forEach(heading => {
    ws.cell(1, headingColumnIndex++)
      .string(heading)
  });
  //Write Data in Excel file
  let rowIndex = 2;
  formattedData.forEach((record: IBlazeRecentData) => {
    let columnIndex = 1;
    Object.keys(record).forEach(columnName => {
      if (columnName == 'Cor') {
        ws.cell(rowIndex, columnIndex++)
          .string(record[columnName])
          .style(colorCell(record[columnName] == "1" ? 'red' : record[columnName] == "2" ? 'black' : "white"))
      } else {
        ws.cell(rowIndex, columnIndex++).string(record[columnName])
      }
    });
    rowIndex++;
  });
  wb.write('data.xlsx');
}

function colorCell(color) {
  return wb.createStyle({
    fill: {
      type: 'pattern',
      fgColor: color,
      patternType: 'solid',
    },
    font: {
      color: color
    },
  });
}
