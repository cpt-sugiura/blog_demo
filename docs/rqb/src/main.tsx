import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// import QueryBuilderCustomElementDemo from "./QueryBuilderCustomElementDemo.tsx";
import QueryBuilderCustomElementDemo from "./QueryBuilderDemo.tsx";

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryBuilderCustomElementDemo  />
  </StrictMode>,
)
