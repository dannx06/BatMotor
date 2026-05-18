# Diagrama de classes — API BatMotor (backend)

Modelo de dados (Prisma) e camadas principais Express.

## draw.io / diagrams.net

Abre o ficheiro **`diagrama-classes-backend.drawio`** (na mesma pasta `docs/`) em:

- [diagrams.net](https://app.diagrams.net/) → **Abrir** → escolher o ficheiro, ou  
- VS Code / Cursor com extensão **Draw.io Integration**.

O ficheiro contém classes de domínio, enums, camadas Express e relações principais. No **domínio**, o layout agrupa **RBAC** à esquerda, **estoque** ao centro em coluna vertical (MateriaPrima ↔ EstoqueAtual / MateriaFornecedor / Fornecedor) e **Movimentacao** à direita; ligações longas (Usuario → Movimentacao, Prisma → Movimentacao) usam percurso ortogonal para não atravessar outras classes.

---

## Código XML

O XML completo está em **`docs/diagrama-classes-backend.drawio`**. Podes copiar o conteúdo desse ficheiro para um novo `.drawio` e importar onde precisares.
