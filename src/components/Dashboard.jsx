import { BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DollarSign, ShoppingBag, TrendingUp, Package } from 'lucide-react';

// Função para formatar moeda
const formatCurrency = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

// Componente para os cartões de KPI (Indicadores-Chave)
const KpiCard = ({ title, value, icon: Icon, description }) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      <p className="text-xs text-muted-foreground">{description}</p>
    </CardContent>
  </Card>
);

// Componente principal do Dashboard
const Dashboard = ({ transactions }) => {
  // Se não houver transações, não renderiza o dashboard para não poluir a tela.
  if (!transactions || transactions.length === 0) {
    return null;
  }

  // --- 1. Processamento de Dados para os KPIs ---
  const activeTransactions = transactions.filter(t => t.status !== 'CANCELADO');
  const totalRevenue = activeTransactions.reduce((acc, t) => acc + parseFloat(t.total_amount), 0);
  const totalSales = activeTransactions.length;
  const averageTicket = totalSales > 0 ? totalRevenue / totalSales : 0;
  const totalItemsSold = activeTransactions.flatMap(t => t.items || []).reduce((acc, item) => acc + item.quantity, 0);

  // --- 2. Processamento para Vendas ao Longo do Tempo ---
  const salesOverTime = activeTransactions.reduce((acc, t) => {
    const date = new Date(t.transaction_date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    if (!acc[date]) {
      acc[date] = 0;
    }
    acc[date] += parseFloat(t.total_amount);
    return acc;
  }, {});

  const salesOverTimeData = Object.keys(salesOverTime).map(date => ({
    date,
    Faturamento: salesOverTime[date],
  })).sort((a, b) => {
    const [dayA, monthA] = a.date.split('/');
    const [dayB, monthB] = b.date.split('/');
    return new Date(`${monthA}/${dayA}/2024`) - new Date(`${monthB}/${dayB}/2024`); // Ordena por data
  });

  // --- 3. Processamento para Produtos Mais Vendidos ---
  const topProducts = activeTransactions
    .flatMap(t => t.items || [])
    .reduce((acc, item) => {
      if (!acc[item.product_name]) {
        acc[item.product_name] = 0;
      }
      acc[item.product_name] += item.quantity;
      return acc;
    }, {});

  const topProductsData = Object.keys(topProducts)
    .map(name => ({ name, Quantidade: topProducts[name] }))
    .sort((a, b) => b.Quantidade - a.Quantidade)
    .slice(0, 5); // Pega o Top 5

  // --- 4. Processamento para Vendas por Forma de Pagamento ---
  const paymentMethodData = activeTransactions
    .flatMap(t => t.payments || [])
    .reduce((acc, payment) => {
      const method = payment.payment_method.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      if (!acc[method]) {
        acc[method] = 0;
      }
      acc[method] += parseFloat(payment.amount);
      return acc;
    }, {});
  
  const paymentMethodChartData = Object.keys(paymentMethodData).map(name => ({
    name,
    Total: paymentMethodData[name],
  }));

  return (
    <div className="space-y-6 mb-6">
      {/* Seção de KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard title="Faturamento Total" value={formatCurrency(totalRevenue)} icon={DollarSign} description="Soma das vendas ativas" />
        <KpiCard title="Ticket Médio" value={formatCurrency(averageTicket)} icon={TrendingUp} description="Valor médio por venda" />
        <KpiCard title="Total de Vendas" value={totalSales.toString()} icon={ShoppingBag} description="Número de transações ativas" />
        <KpiCard title="Itens Vendidos" value={totalItemsSold.toString()} icon={Package} description="Total de produtos vendidos" />
      </div>

      {/* Seção de Gráficos Principais */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Vendas ao Longo do Tempo</CardTitle>
            <CardDescription>Faturamento diário no período selecionado.</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={salesOverTimeData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis tickFormatter={(value) => formatCurrency(value)} />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Area type="monotone" dataKey="Faturamento" stroke="#16a34a" fill="#16a34a" fillOpacity={0.3} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Produtos Mais Vendidos</CardTitle>
            <CardDescription>Top 5 produtos por quantidade vendida.</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topProductsData} layout="vertical" margin={{ top: 5, right: 30, left: 50, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} interval={0} />
                <Tooltip formatter={(value) => `${value} unidades`} />
                <Bar dataKey="Quantidade" fill="#8884d8" background={{ fill: '#eee' }} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
      
      {/* Gráfico de Forma de Pagamento */}
      <Card>
        <CardHeader>
          <CardTitle>Vendas por Forma de Pagamento</CardTitle>
          <CardDescription>Total vendido em cada método de pagamento.</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={paymentMethodChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis tickFormatter={(value) => formatCurrency(value)} />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Legend />
              <Bar dataKey="Total" fill="#16a34a" name="Total Vendido" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
