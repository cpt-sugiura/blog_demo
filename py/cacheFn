import hashlib
import os
import pickle
from typing import Any, Callable
 
 
def sha256hasher(text: str) -> str:
    """
    文字列を sha256 ハッシュにする。
    Windows上でファイルとして保存可能な文字列に変換する目的で用意
 
    Args:
        text (str): ハッシュ化する文字列
 
    Returns:
        str: ハッシュ値
    """
    text_bytes = text.encode('utf-8')
    hash_object = hashlib.sha256(text_bytes)
    return hash_object.hexdigest()
 
 
# キャッシュファイルを置くディレクトリのパス
CACHE_DIR = f'{os.path.dirname(os.path.abspath(__file__))}/cache'
 
 
def cached(func: Callable) -> Callable:
    """
    引数に与えられた関数をキャッシュするデコレータ。
 
    Args:
        func (Callable): キャッシュしたい関数
 
    Returns:
        Callable: 引数で与えられた関数のキャッシュを行う関数
    """
 
    def wrapper(*args: Any, **kwargs: Any) -> Any:
        """
        キャッシュをするためのラッパー関数。
 
        Args:
            *args: 引数
            **kwargs: キーワード引数
 
        Returns:
            Any: 引数で与えられた関数の戻り値
 
        """
        # 関数コード、引数、キーワード引数を連結してSHA256ハッシュ値を算出する
        # このハッシュ値がキャッシュファイルの名前であり、キーであるようにした
        # 関数の中身、引数やキーワード引数が変わった場合でも別のハッシュ値になるようにした
        # 関数名やモジュール名を入れないことで完全なコピペ関数は同一のキャッシュファイルを読むようにした
        func_hash = sha256hasher('-'.join([
            str(func.__code__.co_code),  # 関数のコンパイルされたバイトコード
            str(args),  # 位置引数の値
            str(kwargs),  # キーワード引数の値
        ]))
        # キャッシュのパスを生成
        # 単一のディレクトリにガンガンファイルが増えるのが問題になるなら func_hash をn文字毎に区切ってディレクトリを分ける様にすると良いやも
        cache_path = os.path.join(CACHE_DIR, f'{func_hash}.pkl')
        if os.path.exists(cache_path):
            # キャッシュが存在する場合は、デシリアライズして返す
            with open(cache_path, 'rb') as f:
                result = pickle.load(f)
        else:
            # キャッシュが存在しない場合は、関数を実行してシリアライズして保存する
            result = func(*args, **kwargs)
            with open(cache_path, 'wb') as f:
                pickle.dump(result, f)
        return result
 
    return wrapper
