param (
    [string]$directoryPath = "C:\xxx"  # デフォルトのディレクトリパスを設定します。
)

# 最初にディレクトリパスを絶対パスに変換します。
$absoluteDirectoryPath = Resolve-Path -Path $directoryPath
Write-Host $absoluteDirectoryPath
# 指定されたディレクトリとそのサブディレクトリからすべてのXLSXファイルを検索します。
$excelFiles = Get-ChildItem -Path $absoluteDirectoryPath -Filter *.xlsx -Recurse

# 進捗を追跡するための変数を初期化します。
$totalFiles = $excelFiles.Count
$fileCounter = 0
$skippedFiles = 0

# ルートディレクトリからの相対パスを取得する関数を定義します。
function Get-RelativePath($filePath, $rootPath) {
    $rootPath = [regex]::Escape([System.IO.Path]::GetFullPath($rootPath)) # ルートパスを正規表現でエスケープし、絶対パスを確実に取得します。
    return $filePath -replace "^$rootPath\\"  # ルートパスを取り除いて相対パスを生成します。
}
# 各Excelファイルをテキストに変換します。
foreach ($file in $excelFiles) {
    $fileCounter++
    $excelPath = $file.FullName
    $txtPath = $file.FullName -replace "\.xlsx$", ".txt"
    
    # テキストファイルが既に存在するか確認します。
    if (Test-Path $txtPath) {
        $relativePath = Get-RelativePath -filePath $excelPath -rootPath $absoluteDirectoryPath
        Write-Host "既存のファイルをスキップしています: $relativePath"
        $skippedFiles++
        continue
    }

    # 進捗を表示します。
    $progressPercent = ($fileCounter / $totalFiles) * 100
    $relativePath = Get-RelativePath -filePath $excelPath -rootPath $absoluteDirectoryPath
    Write-Host "処理中 ($fileCounter / $totalFiles) `[$progressPercent%]`: $relativePath"

    # Excelファイルをテキストに変換して保存します。
    $excel = Open-ExcelPackage -Path $excelPath
    $stream = [System.IO.StreamWriter]::new($txtPath)
    # 各シートを順番に処理します。
    foreach ($worksheet in $excel.Workbook.Worksheets) {
        $stream.WriteLine("シート: " + $worksheet.Name)
        # 各行と列を順番に読み取り、テキストファイルに書き出します。
        foreach ($row in $worksheet.Dimension.Start.Row..$worksheet.Dimension.End.Row) {
            $line = ''
            foreach ($col in $worksheet.Dimension.Start.Column..$worksheet.Dimension.End.Column) {
                $cellValue = $worksheet.Cells[$row, $col].Text
                $line += $cellValue + "`t"
            }
            $stream.WriteLine($line.TrimEnd("`t"))
        }
        # シートごとに改行を追加して区切ります。
        $stream.WriteLine()
    }
    $stream.Close()
    Close-ExcelPackage $excel
}

Write-Host "変換が完了しました。総ファイル数: $($totalFiles - $skippedFiles)。スキップされたファイル数: $skippedFiles."
