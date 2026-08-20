with open('server/services/excel/excelExport.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

bd_start = -1
for i, line in enumerate(lines):
    if "const bdSheet = workbook.addWorksheet('Burndown Chart');" in line:
        bd_start = i
        break

end_point = -1
for i, line in enumerate(lines):
    if "const safeName = (projectName" in line:
        end_point = i
        break

if bd_start != -1 and end_point != -1:
    bd_lines = lines[bd_start:end_point]
    
    bd_content = """const { thinBorder } = require('./excelStyles');

const addBurndownSheet = ({ workbook, testCases, project, headerBgColor, headerFontColor }) => {
  const bdHeaderLabels = [
    'Week #', 'Date Range', 'Total Cases', 'Ideal Remaining',
    'Actual Executed', 'Actual Remaining', 'Blocked', 'Passed', 'Failed'
  ];

""" + ''.join(bd_lines) + """};

module.exports = {
  addBurndownSheet
};
"""
    with open('server/services/excel/excelBurndownSheet.js', 'w', encoding='utf-8') as f:
        f.write(bd_content)

    new_export_lines = (
        ["const { addBurndownSheet } = require('./excelBurndownSheet');\n"] +
        lines[:bd_start] +
        ["  // 2. BURNDOWN CHART TAB\n  addBurndownSheet({ workbook, testCases, project, headerBgColor, headerFontColor });\n\n"] +
        lines[end_point:]
    )
    with open('server/services/excel/excelExport.js', 'w', encoding='utf-8') as f:
        f.writelines(new_export_lines)
    print('Burndown sheet extracted successfully!')
