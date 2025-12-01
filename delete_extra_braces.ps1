$content = Get-Content 'app\src\main\java\com\mestre3dt\ui\screens\SessionCockpitScreen.kt' -Encoding UTF8
$newContent = $content[0..560] + $content[563..($content.Length-1)]
$newContent | Set-Content 'app\src\main\java\com\mestre3dt\ui\screens\SessionCockpitScreen.kt' -Encoding UTF8
Write-Host "Deletadas linhas 561-562 com sucesso!"
