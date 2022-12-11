const express = require('express');
const fs = require('fs');
const xl = require('excel4node');

let data = [];

const wb = new xl.Workbook();
const ws = wb.addWorksheet('Resultados Blaze');

const app = express();

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
  const result = await response.json();

  const splitedResult = splitResult(data, result);

  splitedResult.forEach(e => data.unshift(e));

  fs.writeFile("data.json", JSON.stringify(data), function (err) {
    if (err) throw err;
    console.log('complete');
  }
  );
}

function splitResult(data, newData) {

  let result = [];
  let isElementFound = false;

  const lastData10Elements = data.slice(0, 20);

  if (data.length >= 20) {
    lastData10Elements.forEach((dataElement) => {
      if (!isElementFound) {
        newData.forEach((newDataElement, index) => {
          if (newDataElement.id == dataElement.id) {
            result = newData.splice(0, index);
            isElementFound = true;
            console.log(`se encontraron ${result.length} nuevos resultados`);
          }
        })
      }
    })
  } else {
    newData.forEach(e => result.push(e));
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
  formattedData.forEach((record) => {
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
