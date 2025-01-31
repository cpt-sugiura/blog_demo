import {Button, IconButton, MenuItem, Select, TextField} from "@mui/material";
import {Delete} from "@mui/icons-material";
import {ActionWithRulesAndAddersProps, CombinatorSelectorProps, FieldSelectorProps, OperatorSelectorProps, ValueEditorProps} from "react-querybuilder";

// フィールド選択
const FieldSelector = ({options, value, handleOnChange}: FieldSelectorProps) => (
  <Select value={value} onChange={(e) => handleOnChange(e.target.value)} size="small" style={{backgroundColor: "#fff"}}>
    {options.map((field) => (
      <MenuItem key={field.name} value={field.name}>{field.label}</MenuItem>
    ))}
  </Select>
);

const operatorLabelMap: {[p:string]:string} = {
  "=": "=",
  "!=": "!=",
  "<": "<",
  "<=": "<=",
  ">": ">",
  ">=": ">=",
  "begins with": "前方一致",
  "ends with": "後方一致",
  "contains": "文字列に含む",
  "does not contain": "文字列に含まない",
  "does not begin with": "前方一致しない",
  "does not end with": "後方一致しない",
  "is null": "NULL",
  "is not null": "NULL でない",
  "in": ",区切りの要素に含まれる",
  "not in": ",区切りの要素に含まれない",
  "between": "範囲内",
  "not between": "範囲外"
};

// オペレーター選択
const OperatorSelector = ({options, value, handleOnChange}: OperatorSelectorProps) => (
  <Select value={value} onChange={(e) => handleOnChange(e.target.value)} size="small" style={{backgroundColor: "#fff"}}>
    {options.map((operator) =>
      'name' in operator && typeof operator.name === 'string' && 'label' in operator ? ( // OptionGroup の場合を除外.グループを使いたい時は別途実装
        <MenuItem key={operator.name} value={operator.name}>
          {operatorLabelMap[operator.label] ?? operator.label}
        </MenuItem>
      ) : null
    )}

  </Select>
);

// 値入力エディター
const ValueEditor = ({operator, value, handleOnChange}: ValueEditorProps) => {
  if (operator === "null" || operator === "notNull") {
    return null;
  }
  if (operator === "between" || operator === "notBetween") {
    return (
      <div style={{display: "flex", gap: "8px"}}>
        <TextField
          value={value?.[0] || ""}
          onChange={(e) => handleOnChange([e.target.value, value?.[1] || ""])}
          size="small"
          style={{backgroundColor: "#fff"}}
          placeholder="開始"
        />
        <TextField
          value={value?.[1] || ""}
          onChange={(e) => handleOnChange([value?.[0] || "", e.target.value])}
          size="small"
          style={{backgroundColor: "#fff"}}
          placeholder="終了"
        />
      </div>
    );
  }

  return (
    <TextField value={value} onChange={(e) => handleOnChange(e.target.value)} size="small" style={{backgroundColor: "#fff"}}/>
  )
};
// コンビネーター選択
const CombinatorSelector = ({options, value, handleOnChange}: CombinatorSelectorProps) => (
  <Select value={value} onChange={(e) => handleOnChange(e.target.value)} size="small" style={{backgroundColor: "#fff"}}>
    {options.map((option: { name: string; label: string }) => (
      <MenuItem key={option.name} value={option.name}>{option.label}</MenuItem>
    ))}
  </Select>
);

// ルール追加ボタン
const AddRuleAction = ({handleOnClick}: ActionWithRulesAndAddersProps) => (
  <Button variant="contained" color="secondary" onClick={handleOnClick} size="small" style={{backgroundColor: "#fff", color: "#222"}}>
    ルール追加
  </Button>

);

// グループ追加ボタン
const AddGroupAction = ({handleOnClick}: ActionWithRulesAndAddersProps) => (
  <Button variant="contained" color="secondary" onClick={handleOnClick} size="small" style={{backgroundColor: "#fff", color: "#222"}}>
    グループ追加
  </Button>
);

// ルール削除ボタン
const RemoveRuleAction = ({handleOnClick}: ActionWithRulesAndAddersProps) => (
  <IconButton onClick={handleOnClick} size="small" color="error" style={{backgroundColor: "#fff"}}>
    <Delete/>
  </IconButton>
);

// グループ削除ボタン
const RemoveGroupAction = ({handleOnClick}: ActionWithRulesAndAddersProps) => (
  <IconButton onClick={handleOnClick} size="small" color="error" style={{backgroundColor: "#fff"}}>
    <Delete/>
  </IconButton>
);

// まとめてエクスポート
export const rqbMaterialUiControlElements = {
  fieldSelector: FieldSelector,
  operatorSelector: OperatorSelector,
  valueEditor: ValueEditor,
  combinatorSelector: CombinatorSelector,
  addRuleAction: AddRuleAction,
  addGroupAction: AddGroupAction,
  removeRuleAction: RemoveRuleAction,
  removeGroupAction: RemoveGroupAction,
};
