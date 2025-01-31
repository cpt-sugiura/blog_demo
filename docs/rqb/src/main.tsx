import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// import QueryBuilderDemo from "./QueryBuilderCustomElementDemo.tsx";
import QueryBuilderDemo from "./QueryBuilderDemo.tsx";

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryBuilderDemo  />
  </StrictMode>,
)
