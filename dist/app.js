"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const node_fetch_1 = __importDefault(require("node-fetch"));
const data_1 = require("./data");
const fs_1 = __importDefault(require("fs"));
const xl = require('excel4node');
const wb = new xl.Workbook();
const ws = wb.addWorksheet('Resultados Blaze');
const app = (0, express_1.default)();
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
app.listen(port, () => {
    return console.log(`Express is listening at http://localhost:${port}`);
});
function getResults() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log("Buscando resultados...");
        const response = yield (0, node_fetch_1.default)('https://blaze.com/api/roulette_games/recent');
        const result = yield response.json();
        const splitedResult = splitResult(data_1.data, result);
        data_1.data.unshift(...splitedResult);
        fs_1.default.writeFile("data.json", JSON.stringify(data_1.data), function (err) {
            if (err)
                throw err;
            console.log('complete');
        });
    });
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
                });
            }
        });
    }
    else {
        result = [...newData];
    }
    return result;
}
function saveResultsAsXlsFile() {
    console.log("Creando archivo excel");
    let formattedData = [];
    data_1.data.forEach((instance, indexx, record) => {
        const tempArryEl = {
            'Data': record[indexx].created_at,
            'Cor': record[indexx].color.toString(),
            'Número': record[indexx].roll.toString()
        };
        formattedData.push(tempArryEl);
    });
    const headingColumnNames = [
        "Data",
        "Cor",
        "Número",
    ];
    //Write Column Title in Excel file
    let headingColumnIndex = 1;
    headingColumnNames.forEach(heading => {
        ws.cell(1, headingColumnIndex++)
            .string(heading);
    });
    //Write Data in Excel file
    let rowIndex = 2;
    formattedData.forEach((record) => {
        let columnIndex = 1;
        Object.keys(record).forEach(columnName => {
            if (columnName == 'Cor') {
                ws.cell(rowIndex, columnIndex++)
                    .string(record[columnName])
                    .style(colorCell(record[columnName] == "1" ? 'red' : record[columnName] == "2" ? 'black' : "white"));
            }
            else {
                ws.cell(rowIndex, columnIndex++).string(record[columnName]);
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
//# sourceMappingURL=app.js.map