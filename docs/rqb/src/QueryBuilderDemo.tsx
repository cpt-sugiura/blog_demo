import { useState } from "react";
import { QueryBuilder, RuleGroupType } from "react-querybuilder";
import "react-querybuilder/dist/query-builder.css";
import { motion } from "framer-motion";

const fields = [
  { name: "name", label: "名前" },
  { name: "type", label: "種類" },
  { name: "status", label: "ステータス" },
];

const QueryBuilderDemo = () => {
  const [query, setQuery] = useState<RuleGroupType>({
  "combinator": "and",
  "rules": [
    {
      "field": "status",
      "operator": "!=",
      "valueSource": "value",
      "value": "BANNED"
    },
    {
      "combinator": "and",
      "not": false,
      "rules": [
        {
          "field": "name",
          "operator": "beginsWith",
          "valueSource": "value",
          "value": "浜松"
        },
        {
          "field": "name",
          "operator": "endsWith",
          "valueSource": "value",
          "value": "太郎"
        }
      ],
    }
  ],
});

  return (
    <div style={{ padding: "20px", maxWidth: "600px", margin: "auto", fontFamily: "Arial, sans-serif" }}>
      <h1 style={{ fontSize: "20px", fontWeight: "bold", marginBottom: "10px" }}>React Query Builderデモ</h1>
      <div style={{ border: "1px solid #ccc", borderRadius: "8px", padding: "10px", backgroundColor: "#f9f9f9" }}>
        <QueryBuilder
          fields={fields}
          query={query}
          onQueryChange={setQuery}
        />
      </div>
      <motion.div
        style={{ marginTop: "10px", padding: "10px", backgroundColor: "#eaeaea", borderRadius: "6px" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}>
        <h2 style={{ fontSize: "16px", fontWeight: "bold", marginBottom: "5px" }}>JSON形式のクエリデータ</h2>
        <pre style={{ backgroundColor: "#fff", padding: "10px", borderRadius: "6px", border: "1px solid #ccc", fontSize: "14px" }}>
          {JSON.stringify(query, null, 2)}
        </pre>
      </motion.div>
    </div>
  );
};

export default QueryBuilderDemo;
