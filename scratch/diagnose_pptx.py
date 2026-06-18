import zipfile
import re
import os

def check_zip_files(file_path):
    print(f"Opening zip file: {file_path}")
    with zipfile.ZipFile(file_path, 'r') as z:
        for name in z.namelist():
            if name.endswith('.xml'):
                try:
                    content = z.read(name)
                    # Try to parse it with standard xml tree or see if it has unescaped ampersands
                    # Unescaped ampersand is any '&' not followed by a valid entity reference like amp;, lt;, gt;, quot;, apos; or #...;
                    text = content.decode('utf-8', errors='ignore')
                    # Look for raw ampersands
                    # Regex for unescaped ampersands: & followed by something that is not an entity
                    # But first let's see if we can parse it using xml.etree.ElementTree
                    import xml.etree.ElementTree as ET
                    try:
                        ET.fromstring(content)
                    except ET.ParseError as pe:
                        print(f"Parse error in {name}: {pe}")
                        # Let's print the line around the error if possible
                        # We can find column or line
                        line_num = getattr(pe, 'position', (1, 0))[0]
                        col_num = getattr(pe, 'position', (1, 0))[1]
                        lines = text.split('\n')
                        if line_num - 1 < len(lines):
                            err_line = lines[line_num - 1]
                            print(f"  Line {line_num}, Col {col_num}:")
                            print(f"  {err_line[max(0, col_num-50):min(len(err_line), col_num+50)]}")
                except Exception as e:
                    print(f"Error reading {name}: {e}")

if __name__ == "__main__":
    file_path = r"c:\Github repos\projects\Test Nexus\Test Nexus Proposition.pptx"
    check_zip_files(file_path)
