import { ComparisonMatrix as MatrixData } from "../lib/types";

const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

export function ComparisonMatrix({ matrix }: { matrix: MatrixData }) {
  return (
    <table className="w-full border-collapse text-sm font-body">
      <thead>
        <tr className="border-b border-line">
          <th className="py-2 pr-4 text-left text-slate font-body font-medium">Spec</th>
          {matrix.vendors.map((v) => (
            <th key={v.id} className="py-2 px-4 text-left">
              <div className="text-ink">{v.name}</div>
              <div className="font-mono text-xs text-slate">{v.totalPrice ? currency.format(v.totalPrice) : "—"}</div>
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {matrix.rows.map((row) => (
          <tr key={row.fieldKey} className="border-b border-line">
            <td className="py-2 pr-4 text-slate">{row.fieldKey.replace(/_/g, " ")}</td>
            {matrix.vendors.map((v) => {
              const cell = row.values[v.id];
              return (
                <td key={v.id} className="py-2 px-4 font-mono text-ink">
                  {cell ? (
                    <span className={cell.confidence < 0.75 ? "underline decoration-amber decoration-dotted" : ""}>
                      {cell.value} {cell.unit ?? ""}
                    </span>
                  ) : (
                    <span className="text-slate">—</span>
                  )}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
