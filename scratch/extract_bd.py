import os

export_path = r'server/services/excel/excelExport.js'
with open(export_path, 'r', encoding='utf-8') as f:
    code = f.read()

split_point = code.find('  // 2. BURNDOWN CHART TAB')
if split_point != -1:
    end_point = code.find('  const safeName = (projectName')
    burndown_code = code[split_point:end_point].strip()
    
    bd_file_content = '''const { thinBorder } = require('./excelStyles');

const addBurndownSheet = ({ workbook, testCases, project, headerBgColor, headerFontColor }) => {
''' + burndown_code + '''
};

module.exports = {
  addBurndownSheet
};
'''
    with open(r'server/services/excel/excelBurndownSheet.js', 'w', encoding='utf-8') as f:
        f.write(bd_file_content)

    new_export_code = code[:split_point] + '''  // 2. BURNDOWN CHART TAB
  addBurndownSheet({ workbook, testCases, project, headerBgColor, headerFontColor });

''' + code[end_point:]
    
    import_line = "const { addBurndownSheet } = require('./excelBurndownSheet');\n"
    new_export_code = import_line + new_export_code
    
    with open(export_path, 'w', encoding='utf-8') as f:
        f.write(new_export_code)

    print('Burndown sheet extracted successfully!')
