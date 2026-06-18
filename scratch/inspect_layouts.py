from pptx import Presentation

prs = Presentation(r"c:\Github repos\projects\Test Nexus\Test Nexus Proposition.pptx")
print("Slide Layouts:")
for idx, layout in enumerate(prs.slide_layouts):
    print(f"Layout {idx}: {layout.name}")
    print("  Placeholders:")
    for ph in layout.placeholders:
        print(f"    PH index {ph.placeholder_format.idx}: name='{ph.name}', type={ph.placeholder_format.type}")
