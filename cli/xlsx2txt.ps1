param (
    [string]$directoryPath = "C:\xxx"  # �f�t�H���g�̃f�B���N�g���p�X��ݒ肵�܂��B
)

# �ŏ��Ƀf�B���N�g���p�X���΃p�X�ɕϊ����܂��B
$absoluteDirectoryPath = Resolve-Path -Path $directoryPath
Write-Host $absoluteDirectoryPath
# �w�肳�ꂽ�f�B���N�g���Ƃ��̃T�u�f�B���N�g�����炷�ׂĂ�XLSX�t�@�C�����������܂��B
$excelFiles = Get-ChildItem -Path $absoluteDirectoryPath -Filter *.xlsx -Recurse

# �i����ǐՂ��邽�߂̕ϐ������������܂��B
$totalFiles = $excelFiles.Count
$fileCounter = 0
$skippedFiles = 0

# ���[�g�f�B���N�g������̑��΃p�X���擾����֐����`���܂��B
function Get-RelativePath($filePath, $rootPath) {
    $rootPath = [regex]::Escape([System.IO.Path]::GetFullPath($rootPath)) # ���[�g�p�X�𐳋K�\���ŃG�X�P�[�v���A��΃p�X���m���Ɏ擾���܂��B
    return $filePath -replace "^$rootPath\\"  # ���[�g�p�X����菜���đ��΃p�X�𐶐����܂��B
}
# �eExcel�t�@�C�����e�L�X�g�ɕϊ����܂��B
foreach ($file in $excelFiles) {
    $fileCounter++
    $excelPath = $file.FullName
    $txtPath = $file.FullName -replace "\.xlsx$", ".txt"
    
    # �e�L�X�g�t�@�C�������ɑ��݂��邩�m�F���܂��B
    if (Test-Path $txtPath) {
        $relativePath = Get-RelativePath -filePath $excelPath -rootPath $absoluteDirectoryPath
        Write-Host "�����̃t�@�C�����X�L�b�v���Ă��܂�: $relativePath"
        $skippedFiles++
        continue
    }

    # �i����\�����܂��B
    $progressPercent = ($fileCounter / $totalFiles) * 100
    $relativePath = Get-RelativePath -filePath $excelPath -rootPath $absoluteDirectoryPath
    Write-Host "������ ($fileCounter / $totalFiles) `[$progressPercent%]`: $relativePath"

    # Excel�t�@�C�����e�L�X�g�ɕϊ����ĕۑ����܂��B
    $excel = Open-ExcelPackage -Path $excelPath
    $stream = [System.IO.StreamWriter]::new($txtPath)
    # �e�V�[�g�����Ԃɏ������܂��B
    foreach ($worksheet in $excel.Workbook.Worksheets) {
        $stream.WriteLine("�V�[�g: " + $worksheet.Name)
        # �e�s�Ɨ�����Ԃɓǂݎ��A�e�L�X�g�t�@�C���ɏ����o���܂��B
        foreach ($row in $worksheet.Dimension.Start.Row..$worksheet.Dimension.End.Row) {
            $line = ''
            foreach ($col in $worksheet.Dimension.Start.Column..$worksheet.Dimension.End.Column) {
                $cellValue = $worksheet.Cells[$row, $col].Text
                $line += $cellValue + "`t"
            }
            $stream.WriteLine($line.TrimEnd("`t"))
        }
        # �V�[�g���Ƃɉ��s��ǉ����ċ�؂�܂��B
        $stream.WriteLine()
    }
    $stream.Close()
    Close-ExcelPackage $excel
}

Write-Host "�ϊ����������܂����B���t�@�C����: $($totalFiles - $skippedFiles)�B�X�L�b�v���ꂽ�t�@�C����: $skippedFiles."
