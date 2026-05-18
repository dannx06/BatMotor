/**
 * Catálogo de produtos (UI de inventário com imagens locais e ações de exportação).
 */
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { downloadXlsx } from "@/utils/exportXlsx";
import { addBatmotorPdfHeader } from "@/utils/batmotorExportBrand";
import { useEffect, useMemo, useState } from "react";
import { usePermissions } from "@/context/PermissionsContext";
import AddProductModal from "../components/AddProductModal";
import ProductImportModal from "../components/ProductImportModal";

const PAGE_SIZE = 8;

/** Categorias padrão (referência UI) + fallback quando não houver dados no banco. */
export const PRODUCT_UI_DEFAULT_CATEGORIES = [
  "Construção",
  "Eletrônicos",
  "Alimentos",
  "Material de Escritório",
  "Têxtil",
  "Beleza"
];

const DEMO_ROWS = [
  {
    id: "p1",
    name: "Caixa Organizadora",
    code: "PRD-001",
    description: "Caixa plástica de 20L com tampa e alças laterais",
    supplierName: "Distribuidora Alfa",
    category: "Eletrônicos",
    salePrice: 48.99,
    active: true,
    outOfStock: false
  },
  {
    id: "p2",
    name: "Smartwatch",
    code: "PRD-002",
    description: "Pulseira inteligente com monitor cardíaco",
    supplierName: "Tech Import",
    category: "Eletrônicos",
    salePrice: 299.9,
    active: true,
    outOfStock: false
  },
  {
    id: "p3",
    name: "Kit Pincéis Maquiagem",
    code: "PRD-003",
    description: "12 pincéis sintéticos com estojo",
    supplierName: "Beleza Plus",
    category: "Beleza",
    salePrice: 67.5,
    active: false,
    outOfStock: false
  },
  {
    id: "p4",
    name: "Papel A4 Resma",
    code: "PRD-004",
    description: "Resma 500 folhas 75g",
    supplierName: "Papelaria Central",
    category: "Material de Escritório",
    salePrice: 32.0,
    active: true,
    outOfStock: true
  },
  {
    id: "p5",
    name: "Cimento CP II",
    code: "PRD-005",
    description: "Saco 50kg",
    supplierName: "Construtora Sul",
    category: "Construção",
    salePrice: 36.9,
    active: true,
    outOfStock: false
  },
  {
    id: "p6",
    name: "Arroz Tipo 1",
    code: "PRD-006",
    description: "Pacote 5kg",
    supplierName: "Alimentos BR",
    category: "Alimentos",
    salePrice: 28.99,
    active: true,
    outOfStock: false
  },
  {
    id: "p7",
    name: "Toalha de Banho",
    code: "PRD-007",
    description: "Algodão 70x140cm",
    supplierName: "Têxtil Norte",
    category: "Têxtil",
    salePrice: 45.0,
    active: true,
    outOfStock: false
  },
  {
    id: "p8",
    name: "Fone Bluetooth",
    code: "PRD-008",
    description: "Over-ear com cancelamento",
    supplierName: "Tech Import",
    category: "Eletrônicos",
    salePrice: 189.0,
    active: false,
    outOfStock: true
  },
  {
    id: "p9",
    name: "Luminária LED",
    code: "PRD-009",
    description: "Mesa articulada USB",
    supplierName: "Distribuidora Alfa",
    category: "Eletrônicos",
    salePrice: 112.0,
    active: true,
    outOfStock: false
  },
  {
    id: "p10",
    name: "Caderno Universitário",
    code: "PRD-010",
    description: "96 folhas capa dura",
    supplierName: "Papelaria Central",
    category: "Material de Escritório",
    salePrice: 18.9,
    active: true,
    outOfStock: false
  },
  {
    id: "p11",
    name: "Óleo de Soja",
    code: "PRD-011",
    description: "Garrafa 900ml",
    supplierName: "Alimentos BR",
    category: "Alimentos",
    salePrice: 9.99,
    active: true,
    outOfStock: false
  },
  {
    id: "p12",
    name: "Martelo Unha",
    code: "PRD-012",
    description: "Cabo de fibra 27mm",
    supplierName: "Construtora Sul",
    category: "Construção",
    salePrice: 24.5,
    active: true,
    outOfStock: false
  }
];

function formatBRL(n) {
  return Number(n || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatInt(n) {
  return Number(n || 0).toLocaleString("pt-BR");
}

/**
 * Tela exclusiva /produtos — layout referência “Inventário de produtos” (cadastro, ativo/inativo, ações).
 * Não compartilha estado com /estoque (MaterialsPage).
 */
export default function ProductsPage() {
  const { canManageInventory } = usePermissions();
  const [rows, setRows] = useState(DEMO_ROWS);
  const [feedback, setFeedback] = useState({ text: "", kind: "" });
  const [page, setPage] = useState(1);
  const [importOpen, setImportOpen] = useState(false);
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const categoriesFromDb = useMemo(() => {
    const s = new Set(PRODUCT_UI_DEFAULT_CATEGORIES);
    rows.forEach((r) => {
      if (r.category) s.add(r.category);
    });
    return [...s].sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [rows]);

  const supplierOptions = useMemo(() => {
    const map = new Map();
    rows.forEach((r) => {
      if (r.supplierName) map.set(r.supplierName, { id: r.supplierName, name: r.supplierName });
    });
    return [...map.values()];
  }, [rows]);

  const kpiMetrics = useMemo(() => {
    const ativos = rows.filter((r) => r.active).length;
    const inativos = rows.filter((r) => !r.active).length;
    const fora = rows.filter((r) => r.outOfStock).length;
    return [
      {
        key: "total",
        title: "Total de Produtos",
        value: formatInt(rows.length),
        iconWrapClass: "dashboard-metric-v2__icon-wrap--blue",
        icon: "ri-box-3-line"
      },
      {
        key: "ativos",
        title: "Produtos Ativos",
        value: formatInt(ativos),
        iconWrapClass: "dashboard-metric-v2__icon-wrap--green",
        icon: "ri-check-line"
      },
      {
        key: "inativos",
        title: "Produtos Inativos",
        value: formatInt(inativos),
        iconWrapClass: "dashboard-metric-v2__icon-wrap--red",
        icon: "ri-close-line"
      },
      {
        key: "fora",
        title: "Fora de Estoque",
        value: formatInt(fora),
        iconWrapClass: "dashboard-metric-v2__icon-wrap--yellow",
        icon: "ri-alarm-warning-line"
      }
    ];
  }, [rows]);

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageSlice = useMemo(() => {
    const p = Math.min(page, totalPages);
    const start = (p - 1) * PAGE_SIZE;
    return rows.slice(start, start + PAGE_SIZE);
  }, [rows, page, totalPages]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  useEffect(() => {
    if (!canManageInventory) {
      setImportOpen(false);
      setProductModalOpen(false);
      setEditingProduct(null);
    }
  }, [canManageInventory]);

  const exportCatalogPdf = async () => {
    if (!canManageInventory) return;
    if (!rows.length) {
      setFeedback({ text: "Não há produtos para exportar.", kind: "info" });
      return;
    }
    setFeedback({ text: "", kind: "" });
    try {
    const doc = new jsPDF({ orientation: "landscape" });
    const now = new Date();
    const ts = now.toLocaleString("pt-BR");
    let y = await addBatmotorPdfHeader(doc, { x: 14, y: 10, maxWidthMm: 62 });
    doc.setFontSize(11);
    doc.setTextColor(0, 51, 102);
    doc.text("Inventário de produtos", 14, y);
    y += 7;
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(`Gerado em: ${ts}`, 14, y);
    y += 6;
    doc.text(`Registros: ${rows.length}`, 14, y);
    y += 8;

    const body = rows.map((r) => [
      r.name || "—",
      r.code,
      (r.description || "—").slice(0, 80),
      r.supplierName || "—",
      r.category || "—",
      formatBRL(r.salePrice),
      r.active ? "Ativo" : "Inativo",
      r.outOfStock ? "Sim" : "Não"
    ]);

    autoTable(doc, {
      startY: y,
      head: [["Produto", "Codigo", "Descricao", "Fornecedor", "Categoria", "Valor", "Status", "Fora estoque"]],
      body,
      styles: { fontSize: 7, cellPadding: 1.5 },
      headStyles: { fillColor: [30, 58, 138], textColor: 255 }
    });

    const day = now.toISOString().slice(0, 10);
    doc.save(`inventario-produtos-batmotor-${day}.pdf`);
    setFeedback({ text: "PDF exportado com sucesso.", kind: "success" });
    } catch (err) {
      setFeedback({ text: err?.message || "Não foi possível gerar o PDF.", kind: "danger" });
    }
  };

  const exportCatalogXlsx = async () => {
    if (!canManageInventory) return;
    if (!rows.length) {
      setFeedback({ text: "Não há produtos para exportar.", kind: "info" });
      return;
    }
    try {
    const day = new Date().toISOString().slice(0, 10);
    await downloadXlsx(
      `inventario-produtos-batmotor-${day}.xlsx`,
      "Inventario",
      {
        name: "Produto",
        code: "Codigo",
        description: "Descricao",
        supplierName: "Fornecedor",
        category: "Categoria",
        salePrice: "Valor",
        active: "Ativo",
        outOfStock: "Fora estoque"
      },
      rows.map((r) => ({
        ...r,
        salePrice: formatBRL(r.salePrice),
        active: r.active ? "Sim" : "Não",
        outOfStock: r.outOfStock ? "Sim" : "Não"
      }))
    );
    setFeedback({ text: "Planilha Excel exportada.", kind: "success" });
    } catch (err) {
      setFeedback({ text: err?.message || "Não foi possível exportar o Excel.", kind: "danger" });
    }
  };

  const pageNumbers = useMemo(() => {
    const maxVis = 5;
    if (totalPages <= maxVis) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const half = Math.floor(maxVis / 2);
    let start = Math.max(1, safePage - half);
    let end = start + maxVis - 1;
    if (end > totalPages) {
      end = totalPages;
      start = Math.max(1, end - maxVis + 1);
    }
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }, [totalPages, safePage]);

  const openNewProduct = () => {
    setEditingProduct(null);
    setProductModalOpen(true);
  };

  const openEdit = (r) => {
    setEditingProduct({
      id: r.id,
      name: r.name,
      productCode: r.code,
      description: r.description,
      category: r.category,
      supplierId: r.supplierName,
      currentStock: r.outOfStock ? 0 : 10,
      minStock: 1,
      active: r.active,
      unit: "un",
      salePrice: r.salePrice,
      costPrice: r.salePrice * 0.7
    });
    setProductModalOpen(true);
  };

  const supplierLabelFromPayload = (payload) => {
    const sid = payload.supplierId;
    if (sid == null || sid === "") return "—";
    const hit = supplierOptions.find((s) => String(s.id) === String(sid));
    return hit?.name ?? String(sid);
  };

  const handleSaveProduct = (payload) => {
    const supplierName = supplierLabelFromPayload(payload);
    if (editingProduct) {
      setRows((prev) =>
        prev.map((x) =>
          x.id === editingProduct.id
            ? {
                ...x,
                name: payload.name || x.name,
                code: payload.productCode?.trim() || x.code,
                category: payload.category || x.category,
                supplierName,
                salePrice: Number(payload.salePrice) || x.salePrice,
                active: payload.active !== false,
                description: (payload.description && payload.description.trim()) || x.description,
                outOfStock: Number(payload.quantity) <= 0
              }
            : x
        )
      );
    } else {
      const id = `p-${Date.now()}`;
      setRows((prev) => [
        ...prev,
        {
          id,
          name: payload.name || "Novo produto",
          code: payload.productCode || `PRD-${String(prev.length + 1).padStart(3, "0")}`,
          description: (payload.description && payload.description.trim()) || "—",
          supplierName,
          category: payload.category || "Eletrônicos",
          salePrice: Number(payload.salePrice) || 0,
          active: payload.active !== false,
          outOfStock: Number(payload.quantity) <= 0
        }
      ]);
    }
    setProductModalOpen(false);
    setEditingProduct(null);
    setFeedback({ text: "Produto salvo (demonstração local).", kind: "success" });
  };

  const handleDelete = (id) => {
    if (!window.confirm("Excluir este produto da lista?")) return;
    setRows((prev) => prev.filter((x) => x.id !== id));
    setFeedback({ text: "Item removido da lista.", kind: "info" });
  };

  return (
    <div className="products-catalog-page">
      <section className="products-catalog-page__kpis bm-kpis-row row g-4 gy-4 mb-4">
        {kpiMetrics.map((m) => (
          <div key={m.key} className="col-12 col-sm-6 col-xl-6 dashboard-kpi-col">
            <article className={`dashboard-metric-v2 products-catalog-page__kpi dashboard-metric-v2--${m.key}`}>
              <div className="dashboard-metric-v2__body">
                <span className="dashboard-metric-v2__label">{m.title}</span>
                <strong className="dashboard-metric-v2__value">{m.value}</strong>
              </div>
              <div className={`dashboard-metric-v2__icon-wrap ${m.iconWrapClass}`} aria-hidden>
                <i className={m.icon} />
              </div>
            </article>
          </div>
        ))}
      </section>

      <div className="products-catalog-page__toolbar">
        <div className="products-catalog-page__titles">
          <h2 className="products-catalog-page__title">Inventário de produtos</h2>
          <p className="products-catalog-page__subtitle">
            Gerencie seus itens de estoque e níveis de inventário
          </p>
        </div>
        <div className="products-catalog-page__actions">
          {canManageInventory ? (
            <button type="button" className="btn products-catalog-page__btn-outline" onClick={() => setImportOpen(true)}>
              <i className="ri-file-upload-line me-1" aria-hidden />
              Importar
            </button>
          ) : null}
          {canManageInventory ? (
            <button type="button" className="btn products-catalog-page__btn-outline" onClick={exportCatalogPdf}>
              <i className="ri-file-pdf-line me-1" aria-hidden />
              PDF
            </button>
          ) : null}
          {canManageInventory ? (
            <button type="button" className="btn products-catalog-page__btn-outline" onClick={exportCatalogXlsx}>
              <i className="ri-file-excel-2-line me-1" aria-hidden />
              Excel
            </button>
          ) : null}
          {canManageInventory ? (
            <button type="button" className="btn products-catalog-page__btn-primary" onClick={openNewProduct}>
              <i className="ri-add-line me-1" aria-hidden />
              Adicionar Produto
            </button>
          ) : null}
        </div>
      </div>

      {feedback.text ? (
        <div
          className={`products-catalog-page__alert products-catalog-page__alert--${feedback.kind || "info"} mb-3`}
          role="status"
        >
          {feedback.text}
        </div>
      ) : null}

      <div className="card products-catalog-page__table-card border-0">
        <div className="table-responsive">
          <table className="table align-middle mb-0 products-catalog-table">
            <thead>
              <tr>
                <th scope="col">Produto</th>
                <th scope="col">Código</th>
                <th scope="col">Descrição</th>
                <th scope="col">Fornecedor</th>
                <th scope="col">Categoria</th>
                <th scope="col">Valor</th>
                <th scope="col">Status</th>
                <th scope="col" className="text-end">
                  Ação
                </th>
              </tr>
            </thead>
            <tbody>
              {pageSlice.length ? (
                pageSlice.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <div className="products-catalog-table__product-cell">
                        <span className="products-catalog-table__swatch" aria-hidden>
                          <i className="ri-archive-line" />
                        </span>
                        <span className="products-catalog-table__product-name">{r.name}</span>
                      </div>
                    </td>
                    <td className="products-catalog-table__mono">{r.code}</td>
                    <td className="products-catalog-table__desc">{r.description}</td>
                    <td className="products-catalog-table__muted">{r.supplierName}</td>
                    <td className="products-catalog-table__muted">{r.category}</td>
                    <td className="products-catalog-table__mono">{formatBRL(r.salePrice)}</td>
                    <td>
                      <span
                        className={`products-catalog-table__pill products-catalog-table__pill--${r.active ? "ativo" : "inativo"}`}
                      >
                        {r.active ? "Ativo" : "Inativo"}
                      </span>
                    </td>
                    <td className="text-end">
                      {canManageInventory ? (
                        <div className="products-catalog-table__actions">
                          <button
                            type="button"
                            className="products-catalog-table__icon-btn"
                            aria-label="Editar"
                            onClick={() => openEdit(r)}
                          >
                            <i className="ri-pencil-line" aria-hidden />
                          </button>
                          <button
                            type="button"
                            className="products-catalog-table__icon-btn products-catalog-table__icon-btn--danger"
                            aria-label="Excluir"
                            onClick={() => handleDelete(r.id)}
                          >
                            <i className="ri-delete-bin-line" aria-hidden />
                          </button>
                        </div>
                      ) : (
                        <span className="text-muted small">—</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8}>
                    <div className="products-catalog-table__empty py-5 text-center text-muted">
                      Nenhum produto cadastrado.
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {rows.length > 0 ? (
        <nav className="products-catalog-page__pagination" aria-label="Paginação">
          <button
            type="button"
            className="products-catalog-page__page-btn"
            disabled={safePage <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            aria-label="Página anterior"
          >
            &lt;
          </button>
          {pageNumbers.map((n) => (
            <button
              key={n}
              type="button"
              className={`products-catalog-page__page-btn${n === safePage ? " is-active" : ""}`}
              onClick={() => setPage(n)}
            >
              {n}
            </button>
          ))}
          <button
            type="button"
            className="products-catalog-page__page-btn"
            disabled={safePage >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            aria-label="Próxima página"
          >
            &gt;
          </button>
        </nav>
      ) : null}

      <ProductImportModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onImported={() => {
          setImportOpen(false);
          setFeedback({ text: "Importação concluída (demonstração).", kind: "success" });
        }}
      />

      <AddProductModal
        open={productModalOpen}
        onClose={() => {
          setProductModalOpen(false);
          setEditingProduct(null);
        }}
        suppliers={supplierOptions}
        categoriesFromDb={categoriesFromDb}
        editingMaterial={editingProduct}
        onSave={handleSaveProduct}
        isSaving={false}
      />
    </div>
  );
}
