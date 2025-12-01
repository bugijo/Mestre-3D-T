with open('app/src/main/java/com/mestre3dt/ui/screens/SessionCockpitScreen.kt', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Deletar linha 561 (índice 560 porque 0-indexed)
new_lines = lines[:560] + lines[561:]

with open('app/src/main/java/com/mestre3dt/ui/screens/SessionCockpitScreen.kt', 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print("✅ Linha 561 deletada com sucesso!")
print(f"Total de linhas antes: {len(lines)}")
print(f"Total de linhas depois: {len(new_lines)}")
