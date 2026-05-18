# Diagrama de casos de uso — API BatMotor (backend)

## draw.io / diagrams.net

Abre o ficheiro **`diagrama-casos-de-uso-backend.drawio`** (na mesma pasta `docs/`) em:

- [diagrams.net](https://app.diagrams.net/) → **Abrir** → escolher o ficheiro, ou  
- VS Code / Cursor com extensão **Draw.io Integration**.

O diagrama usa **generalização entre atores** (seta com triângulo vazio): **Administrador** e **Gerente** herdam os casos de uso do nível abaixo, por isso não se repetem linhas para movimentação, consulta e relatórios. **Cliente HTTP** fica no topo, junto dos casos típicos de API (`/auth`, `/movimentacao`, consultas). Dentro do sistema, os casos de uso estão em **duas colunas** (acesso comum vs. gestão/relatórios) para reduzir cruzamentos.

---

## Código XML (copiar para ficheiro `.drawio` se preferires colar manualmente)

O conteúdo está em **`docs/diagrama-casos-de-uso-backend.drawio`**. Abre esse ficheiro num editor de texto, copia tudo e guarda com extensão `.drawio`, depois abre no diagrams.net.
