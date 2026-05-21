import { Document, Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer';
import type { Orcamento, ItemOrcamento } from '../types';

interface OrcamentoPDFProps {
  orcamento: Orcamento;
}

const styles = StyleSheet.create({
  page: { padding: '15mm', fontFamily: 'Helvetica', fontSize: 10, color: '#333' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2 solid #ff530d', paddingBottom: 10, marginBottom: 10 },
  logo: { height: 80 },
  numeroOrcamento: { textAlign: 'center', fontSize: 18, fontWeight: 'bold', color: '#ff530d', marginBottom: 5 },
  data: { textAlign: 'center', fontSize: 9, color: '#555', marginBottom: 15 },
  th: { padding: 8, background: '#ff530d', color: '#fff', fontWeight: 'bold' },
  td: { padding: 7, borderBottom: '1 solid #e5e7eb', fontSize: 9 },
  table: { width: '100%', marginTop: 8 },
  resumo: { marginTop: 15, background: '#fef6f2', border: '1 solid #ff530d', borderRadius: 6, padding: 8 },
  condicoes: { marginTop: 15, background: '#fef6f2', border: '1 solid #ff530d', borderRadius: 6, padding: 8 },
  footer: { textAlign: 'center', fontSize: 8, color: '#777', marginTop: 15 },
});

function formatData(data: Date): string {
  return data.toLocaleDateString('pt-BR');
}

function formatValor(valor: number): string {
  return `R$ ${valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
}

export function OrcamentoPDF({ orcamento }: OrcamentoPDFProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
         <View style={styles.header}>
          <Image src="/imagens/cozincainox.png" style={styles.logo} />
          <Text style={{ fontSize: 10, textAlign: 'right', color: '#555' }}>COZINCA INOX PRODUTOS E SERVICOS LTDA{'\n'}CNPJ: 00.000.000/0001-00</Text>
        </View>
        <Text style={styles.numeroOrcamento}>ORÇAMENTO Nº {orcamento.codigo}</Text>
        <Text style={{ textAlign: 'center', fontSize: 9, color: '#555', marginBottom: 15 }}>Data: {formatData(orcamento.criadoEm)}</Text>
        <table style={{ width: '100%', marginBottom: 10, fontSize: 9 }}>
          <tbody>
            <tr><td style={{ width: '15%', fontWeight: 'bold' }}>Cliente:</td><td style={{ width: '85%' }}>{orcamento.nomeCliente}</td></tr>
            <tr><td style={{ fontWeight: 'bold' }}>Endereço:</td><td>{orcamento.endereco}</td></tr>
            <tr><td style={{ fontWeight: 'bold' }}>Telefone:</td><td>{orcamento.telefone}</td></tr>
            <tr><td style={{ fontWeight: 'bold' }}>Email:</td><td>{orcamento.email}</td></tr>
            <tr><td style={{ fontWeight: 'bold' }}>CNPJ/CPF:</td><td>{orcamento.cnpj}</td></tr>
          </tbody>
        </table>
        <TableOrcamento itens={orcamento.itens} />
        <View style={styles.resumo}>
          <Text>Total Produtos:    <Text style={{ fontWeight: 'bold' }}>{formatValor(orcamento.totalProdutos)}</Text></Text>
          <Text>Frete:    <Text style={{ fontWeight: 'bold' }}>{formatValor(orcamento.frete)}</Text></Text>
          <Text>Desconto ({orcamento.desconto}%):    <Text style={{ fontWeight: 'bold', color: '#ff530d' }}>- {formatValor(orcamento.valorDesconto)}</Text></Text>
          <Text style={{ marginTop: 5, fontWeight: 'bold', fontSize: 12 }}>Total Final:    <Text style={{ color: '#ff530d', fontSize: 14 }}>{formatValor(orcamento.totalFinal)}</Text></Text>
        </View>
        <View style={styles.condicoes}>
          <Text style={{ fontWeight: 'bold', marginBottom: 4 }}>Forma de Pagamento</Text>
          <Text>{orcamento.formaPagamento || '—'}</Text>
          <Text style={{ fontWeight: 'bold', marginTop: 8, marginBottom: 4 }}>Prazo de Entrega</Text>
          <Text>{orcamento.condicoesEntrega || '—'}</Text>
          <Text style={{ fontWeight: 'bold', marginTop: 8 }}>Assinatura do Vendedor</Text>
          <Text>{orcamento.assinaturaVendedor}</Text>
        </View>
        <Text style={styles.footer}>Este orçamento possui validade de 30 dias a partir da data de emissão.</Text>
      </Page>
    </Document>
  );
}

function TableOrcamento({ itens }: { itens: ItemOrcamento[] }) {
  const grupos = new Map<string, ItemOrcamento[]>();
  itens.forEach((item) => {
    const setor = item.setor || '';
    if (!grupos.has(setor)) grupos.set(setor, []);
    grupos.get(setor)!.push(item);
  });

  return (
    <View style={{ marginTop: 10 }}>
      <table style={styles.table}>
        <thead>
          <tr><th style={{ ...styles.th, width: '25%' }}>Produto</th><th style={{ ...styles.th, width: '25%' }}>Descricao</th><th style={{ ...styles.th, textAlign: 'right', width: '8%' }}>Qtd</th><th style={{ ...styles.th, textAlign: 'right', width: '12%' }}>Preco Un.</th><th style={{ ...styles.th, textAlign: 'right', width: '12%' }}>Total</th></tr>
        </thead>
        <tbody>
          {Array.from(grupos.entries()).map(([setor, itensGrupo]) => (
            <>
              <tr key={setor || 'sem-setor'}>
                <td colSpan={5} style={{ background: '#1c1c1c', color: '#fff', padding: 6, fontWeight: 'bold', fontSize: 9 }}>{setor || ' SEM SETOR '}</td>
              </tr>
              {itensGrupo.map((item, idx) => (
                <tr key={idx} style={{ background: idx % 2 === 0 ? '#f8f9fa' : '#fff' }}>
                  <td style={styles.td}>{item.nome}</td>
                  <td style={styles.td}>{item.descricao}</td>
                  <td style={{ ...styles.td, textAlign: 'right' }}>{item.quantidade}</td>
                  <td style={{ ...styles.td, textAlign: 'right' }}>{formatValor(item.precoUnitario)}</td>
                  <td style={{ ...styles.td, textAlign: 'right' }}>{formatValor(item.precoTotal)}</td>
                </tr>
              ))}
            </>
          ))}
        </tbody>
      </table>
    </View>
  );
}

export async function gerarEBaixarPDF(orcamento: Orcamento): Promise<void> {
  const { pdf } = await import('@react-pdf/renderer');
  const blob = await pdf(<OrcamentoPDF orcamento={orcamento} />).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `Orcamento_${orcamento.codigo}.pdf`;
  document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
}
