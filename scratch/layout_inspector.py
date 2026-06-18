from pptx import Presentation

prs = Presentation(r"c:\Github repos\projects\Test Nexus\Test Nexus Proposition.pptx")
print("Layout list:")
for idx, layout in enumerate(prs.slide_layouts):
    print(f"Layout {idx}: {layout.name}")
    for ph in layout.placeholders:
        print(f"  PH {ph.placeholder_format.idx}: name='{ph.name}' type={ph.placeholder_format.type}")
