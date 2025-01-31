import { useState } from "react";
import { QueryBuilder, RuleGroupType } from "react-querybuilder";
import "react-querybuilder/dist/query-builder.css";
import { motion } from "framer-motion";
import {rqbMaterialUiControlElements} from "./RqbMaterialUiControls.tsx";

const fields = [
  { name: "name", label: "名前" },
  { name: "type", label: "種類" },
  { name: "status", label: "ステータス" },
];

const QueryBuilderCustomElementDemo = () => {
  const [query, setQuery] = useState<RuleGroupType>({
    combinator: "and",
    rules: [
      {
        field: "status",
        operator: "!=",
        valueSource: "value",
        value: "BANNED"
      },
      {
        combinator: "and",
        not: false,
        rules: [
          {
            field: "name",
            operator: "beginsWith",
            valueSource: "value",
            value: "浜松"
          },
          {
            field: "name",
            operator: "endsWith",
            valueSource: "value",
            value: "太郎"
          }
        ],
      }
    ],
  });

  return (
    <div style={{ padding: "20px", maxWidth: "700px", margin: "auto", fontFamily: "Arial, sans-serif" }}>
      <h1 style={{ fontSize: "22px", fontWeight: "bold", marginBottom: "12px", color: "#333" }}>React Query Builder デモ（カスタムデザイン）</h1>
      <div style={{ border: "3px solid #444", borderRadius: "10px", padding: "12px", backgroundColor: "#fafafa" }}>
        <QueryBuilder
          fields={fields}
          query={query}
          onQueryChange={setQuery}
          controlElements={rqbMaterialUiControlElements}
        />
      </div>
      <motion.div
        style={{ marginTop: "12px", padding: "12px", backgroundColor: "#e0e0e0", borderRadius: "8px" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}>
        <h2 style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "6px", color: "#222" }}>JSON形式のクエリデータ</h2>
        <pre style={{ backgroundColor: "#fff", padding: "12px", borderRadius: "8px", border: "2px solid #bbb", fontSize: "14px" }}>
          {JSON.stringify(query, null, 2)}
        </pre>
      </motion.div>
    </div>
  );
};

export default QueryBuilderCustomElementDemo;
