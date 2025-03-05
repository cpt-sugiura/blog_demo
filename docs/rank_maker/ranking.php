<?php
// ranking.php
// ※本ファイル1つで全機能を実現します

// セッションIDを GET/POST から取得。なければ新規生成。
$sessionId = $_GET['session'] ?? $_POST['session'] ?? null;
if (!$sessionId) {
    $sessionId = uniqid();
}

// ディレクトリ設定
$rankingDataDir = 'ranking-data'; // 対象・ログ格納ディレクトリ
$targetsFile    = $rankingDataDir . '/targets.txt';
$logsDir        = $rankingDataDir . '/logs';
if (!file_exists($logsDir)) {
    mkdir($logsDir, 0777, true);
}
$sessionLogFile = $logsDir . '/' . $sessionId . '.json';

// 画像参照ディレクトリ（変更可能）
$imagesDir = 'images';

// 対象データの読み込み（各行が1対象）
$targets = [];
if (file_exists($targetsFile)) {
    $lines = file($targetsFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        $line = trim($line);
        if ($line !== '') {
            $targets[] = $line;
        }
    }
}
if (empty($targets)) {
    echo "対象データが存在しません。" . $targetsFile . " を作成してください。";
    exit;
}

// 画像マッピングの構築
// images ディレクトリ内の *.txt を走査し、内容が対象文字列と一致すれば、同名の jpg/png を採用
$imageMapping = [];
if (is_dir($imagesDir)) {
    $files = scandir($imagesDir);
    foreach ($files as $file) {
        if (preg_match('/^(.*)\.txt$/', $file, $matches)) {
            $baseName    = $matches[1];
            $txtFilePath = $imagesDir . '/' . $file;
            $content     = trim(file_get_contents($txtFilePath));
            if (in_array($content, $targets)) {
                if (file_exists($imagesDir . '/' . $baseName . '.jpg')) {
                    $imageMapping[$content] = $imagesDir . '/' . $baseName . '.jpg';
                } elseif (file_exists($imagesDir . '/' . $baseName . '.png')) {
                    $imageMapping[$content] = $imagesDir . '/' . $baseName . '.png';
                }
            }
        }
    }
}

// ログファイルの読み込み（既存の比較結果を再利用）
$logData = [];
if (file_exists($sessionLogFile)) {
    $logContent = file_get_contents($sessionLogFile);
    $logData    = json_decode($logContent, true);
    if (!is_array($logData)) {
        $logData = [];
    }
}

// POST処理（新規比較 / 取り消し / ログ取り込み）
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action'])) {
    // ログ取り込み処理
    if ($_POST['action'] === 'import') {
        if (isset($_FILES['logfile']) && $_FILES['logfile']['error'] === UPLOAD_ERR_OK) {
            $uploadedFile    = $_FILES['logfile']['tmp_name'];
            $importedContent = file_get_contents($uploadedFile);
            $importedLogData = json_decode($importedContent, true);
            if (is_array($importedLogData)) {
                // 現在の対象データに含まれる比較のみを取り込む
                $filteredImported = [];
                foreach ($importedLogData as $entry) {
                    if (isset($entry['subject1'], $entry['subject2'], $entry['result'])) {
                        if (in_array($entry['subject1'], $targets) && in_array($entry['subject2'], $targets)) {
                            $filteredImported[] = $entry;
                        }
                    }
                }
                // 重複を避けつつ既存ログにマージ
                foreach ($filteredImported as $newEntry) {
                    if (!in_array($newEntry, $logData)) {
                        $logData[] = $newEntry;
                    }
                }
                file_put_contents($sessionLogFile, json_encode($logData));
            }
        }
        header("Location: " . $_SERVER['PHP_SELF'] . "?session=" . urlencode($sessionId));
        exit;
    }
    if ($_POST['action'] === 'compare') {
        // 比較結果の記録
        $subject1 = $_POST['subject1'] ?? '';
        $subject2 = $_POST['subject2'] ?? '';
        $choice   = $_POST['choice'] ?? '';
        if (in_array($subject1, $targets) && in_array($subject2, $targets) &&
            ($choice === 'left' || $choice === 'right' || $choice === 'tie')) {
            $logData[] = [
                'subject1'  => $subject1,
                'subject2'  => $subject2,
                'result'    => $choice,
                'timestamp' => time()
            ];
            file_put_contents($sessionLogFile, json_encode($logData));
        }
        header("Location: " . $_SERVER['PHP_SELF'] . "?session=" . urlencode($sessionId));
        exit;
    }
    if ($_POST['action'] === 'undo') {
        // 直近の比較を取り消す
        if (!empty($logData)) {
            array_pop($logData);
            file_put_contents($sessionLogFile, json_encode($logData));
        }
        header("Location: " . $_SERVER['PHP_SELF'] . "?session=" . urlencode($sessionId));
        exit;
    }
}

// 比較するペアの決定
// 全対象から一意な組み合わせ（順序は問わない）を作成
$allPairs = [];
$n        = count($targets);
for ($i = 0; $i < $n; $i++) {
    for ($j = $i + 1; $j < $n; $j++) {
        $allPairs[] = [$targets[$i], $targets[$j]];
    }
}
// 既に比較済みのペア（順序に依存せず）を記録
$comparedPairs = [];
foreach ($logData as $entry) {
    $pair = [$entry['subject1'], $entry['subject2']];
    sort($pair);
    $comparedPairs[] = implode("||", $pair);
}
// 未比較のペアを抽出
$remainingPairs = [];
foreach ($allPairs as $pair) {
    $sortedPair = $pair;
    sort($sortedPair);
    $key = implode("||", $sortedPair);
    if (!in_array($key, $comparedPairs)) {
        $remainingPairs[] = $pair;
    }
}
$nextPair = null;
if (!empty($remainingPairs)) {
    // 未比較ペアからランダムに1組選択
    $nextPair = $remainingPairs[array_rand($remainingPairs)];
}

// ランキング算出
// シンプルに「勝ち＝1点、引き分け＝0.5点」とし、各対象の合計点で並べる
$scores = [];
foreach ($targets as $subject) {
    $scores[$subject] = 0;
}
foreach ($logData as $entry) {
    if ($entry['result'] === 'left') {
        $scores[$entry['subject1']] += 1;
    } elseif ($entry['result'] === 'right') {
        $scores[$entry['subject2']] += 1;
    } elseif ($entry['result'] === 'tie') {
        $scores[$entry['subject1']] += 0.5;
        $scores[$entry['subject2']] += 0.5;
    }
}
arsort($scores);
?>
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>ランキングシステム</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 0;
        }

        .container {
            width: 95%;
            margin: auto;
        }

        .header {
            text-align: center;
            padding: 20px;
            background: #f0f0f0;
        }

        /* レイアウト全体を左右に分割 */
        .main-content {
            display: flex;
        }

        /* 左カラムはランキング、右カラムは比較画面 */
        .ranking-column {
            width: 25%;
            padding: 10px;
            border-right: 1px solid #ccc;
            overflow-y: auto;
            max-height: 80vh;
        }

        .comparison-column {
            width: 75%;
            padding: 20px;
        }

        .ranking-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }

        .ranking-table th, .ranking-table td {
            border: 1px solid #ccc;
            padding: 8px;
            text-align: center;
        }

        .comparison {
            display: flex;
            justify-content: space-around;
            margin: 20px 0;
        }

        .comparison-item {
            width: 45%;
            border: 1px solid #ccc;
            padding: 10px;
            text-align: center;
        }

        .comparison-item img {
            max-width: 100%;
            height: auto;
        }

        .button {
            padding: 10px 20px;
            font-size: 16px;
            margin: 5px;
        }

        .import-form {
            margin-top: 20px;
            text-align: center;
        }
    </style>
</head>
<body>
<div class="container">
    <div class="header">
        <h1>ランキングシステム</h1>
        <p>セッションID: <?php
            echo htmlspecialchars($sessionId); ?></p>
    </div>

    <div class="main-content">
        <!-- ランキングカラム（左側） -->
        <div class="ranking-column">
            <h2>現在のランキング</h2>
            <table class="ranking-table">
                <tr>
                    <th>順位</th>
                    <th>対象</th>
                    <th>スコア</th>
                </tr>
                <?php
                $rank = 1;
                foreach ($scores as $subject => $score) {
                    echo "<tr>";
                    echo "<td>" . $rank . "</td>";
                    echo "<td>" . htmlspecialchars($subject) . "</td>";
                    echo "<td>" . $score . "</td>";
                    echo "</tr>";
                    $rank++;
                }
                ?>
            </table>
            <!-- ログ取り込みフォーム -->
            <div class="import-form">
                <h2>ログの取り込み</h2>
                <form method="post" action="<?php
                echo $_SERVER['PHP_SELF'] . '?session=' . urlencode($sessionId); ?>" enctype="multipart/form-data">
                    <input type="file" name="logfile" accept="application/json" required>
                    <input type="hidden" name="action" value="import">
                    <br>
                    <button type="submit" class="button" onclick="return confirm('ログファイルを取り込みますか？');">
                        ログをインポート
                    </button>
                </form>
            </div>
        </div>

        <!-- 比較カラム（中央～右側） -->
        <div class="comparison-column">
            <?php
            if ($nextPair):
                $subjectLeft = $nextPair[0];
                $subjectRight = $nextPair[1];
                ?>
                <h2>比較する対象を選択してください</h2>
                <form method="post" action="<?php
                echo $_SERVER['PHP_SELF'] . '?session=' . urlencode($sessionId); ?>">
                    <div class="comparison">
                        <div class="comparison-item">
                            <?php
                            if (isset($imageMapping[$subjectLeft])) {
                                echo "<img src='" . htmlspecialchars(
                                        $imageMapping[$subjectLeft]
                                    ) . "' alt='" . htmlspecialchars($subjectLeft) . "'>";
                            } else {
                                echo "<div style='width:200px;height:200px;border:1px solid #ccc;display:flex;align-items:center;justify-content:center;'>No Image</div>";
                            }
                            echo "<p>" . htmlspecialchars($subjectLeft) . "</p>";
                            ?>
                            <button type="submit" name="choice" value="left" class="button"
                                    onclick="return confirm('本当に選択しますか？');">こちらが上位
                            </button>
                        </div>
                        <div class="comparison-item">
                            <?php
                            if (isset($imageMapping[$subjectRight])) {
                                echo "<img src='" . htmlspecialchars(
                                        $imageMapping[$subjectRight]
                                    ) . "' alt='" . htmlspecialchars($subjectRight) . "'>";
                            } else {
                                echo "<div style='width:200px;height:200px;border:1px solid #ccc;display:flex;align-items:center;justify-content:center;'>No Image</div>";
                            }
                            echo "<p>" . htmlspecialchars($subjectRight) . "</p>";
                            ?>
                            <button type="submit" name="choice" value="right" class="button"
                                    onclick="return confirm('本当に選択しますか？');">こちらが上位
                            </button>
                        </div>
                    </div>
                    <div style="text-align:center; margin:10px;">
                        <button type="submit" name="choice" value="tie" class="button"
                                onclick="return confirm('本当に引き分けにしますか？');">引き分け
                        </button>
                    </div>
                    <!-- hidden フィールドで対象情報とアクションを保持 -->
                    <input type="hidden" name="subject1" value="<?php
                    echo htmlspecialchars($subjectLeft); ?>">
                    <input type="hidden" name="subject2" value="<?php
                    echo htmlspecialchars($subjectRight); ?>">
                    <input type="hidden" name="action" value="compare">
                </form>
            <?php
            else: ?>
                <h2>全ての比較が完了しました</h2>
            <?php
            endif; ?>

            <!-- 取り消し（Undo）ボタン -->
            <form method="post" action="<?php
            echo $_SERVER['PHP_SELF'] . '?session=' . urlencode($sessionId); ?>" style="text-align:center;">
                <input type="hidden" name="action" value="undo">
                <button type="submit" class="button" onclick="return confirm('最後の比較を取り消しますか？');">取り消し
                                                                                                              (Undo)
                </button>
            </form>
        </div>
    </div>
</div>
</body>
</html>
