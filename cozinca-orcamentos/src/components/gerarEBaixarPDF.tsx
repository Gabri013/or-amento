import type { Orcamento } from '../types';

export async function gerarEBaixarPDF(orcamento: Orcamento): Promise<void> {
  const { pdf } = await import('@react-pdf/renderer');
  const { OrcamentoPDF } = await import('./OrcamentoPDF');
  const blob = await pdf(<OrcamentoPDF orcamento={orcamento} />).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Orcamento_${orcamento.codigo}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}