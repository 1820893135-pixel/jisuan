const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');

// Path to the Excel file
const excelFilePath = path.resolve(__dirname, '../data/CulRelPro_China_1961-2019.xls');

// Output JSON file path
const outputJsonPath = path.resolve(__dirname, '../data/relics.json');

try {
  // Read the Excel file
  const workbook = xlsx.readFile(excelFilePath);
  const worksheet = workbook.Sheets['Tab.1'];

  // Convert the sheet to JSON
  const rawData = xlsx.utils.sheet_to_json(worksheet, { header: 1 });

  // Extract headers and relevant columns
  const headers = rawData[0];
  const columnsToExtract = [
    '序号',
    '单位名称（中文）',
    '时代（中文）',
    '地址（中文）',
    '类型（中文）',
    '批次（中文）',
    '省级政区名称（中文）',
  ];

  const indicesToExtract = columnsToExtract.map((col) => headers.indexOf(col));
  const extractedData = rawData.slice(1).map((row) =>
    indicesToExtract.reduce((acc, index, colIdx) => {
      acc[columnsToExtract[colIdx]] = row[index];
      return acc;
    }, {})
  );

  // Write to JSON
  fs.writeFileSync(outputJsonPath, JSON.stringify(extractedData, null, 2), 'utf8');
  console.log(`Data successfully written to ${outputJsonPath}`);
} catch (error) {
  console.error('Error processing the Excel file:', error);
  process.exit(1);
}