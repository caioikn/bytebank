import { Armazenador } from "../utils/Armazenador.js";
import { ValidaDebito, ValidaDeposito } from "./Decorators.js";
import { GrupoTransacao } from "./GrupoTransacao.js";
import { TipoTransacao } from "./TipoTransacao.js";
import { Transacao } from "./Transacao.js";

export class Conta {
  protected nome: string;
  protected saldo: number = Armazenador.obter<number>("saldo") || 0;
  private transacoes: Transacao[] = Armazenador.obter<Transacao[]>(("transacoes"), (key: string, value: any) => {
    if (key === "data") {
      return new Date(value);
    }

    return value;
  }) || [];

  constructor(nome: string) {
    this.nome = nome;
  }

  getTitular(): string {
    return this.nome;
  }

  @ValidaDebito
  private debitar(valor: number): void {  
    this.saldo -= valor;
    Armazenador.salvar("saldo", this.saldo.toString());
  }

  @ValidaDeposito
  private depositar(valor: number): void {  
    this.saldo += valor;
    Armazenador.salvar("saldo", this.saldo.toString());
  }

  getSaldo() {
    return this.saldo;
  }

  getDataAcesso(): Date {
    return new Date();
  }

  getGruposTransacoes(): GrupoTransacao[] {
    const gruposTransacoes: GrupoTransacao[] = [];
    const listaTransacoes: Transacao[] = structuredClone(this.transacoes);
    const transacoesOrdenadas: Transacao[] = listaTransacoes.sort((t1, t2) => t2.data.getTime() - t1.data.getTime());

    let labelAtualGrupoTransacao: string = "";

    for (let transacao of transacoesOrdenadas) {
      let labelGrupoTransacao: string = transacao.data.toLocaleDateString("pt-br", { month: "long", year: "numeric" });

      if (labelAtualGrupoTransacao !== labelGrupoTransacao) {
        labelAtualGrupoTransacao = labelGrupoTransacao;
        
        gruposTransacoes.push({
          label: labelAtualGrupoTransacao,
          transacoes: []
        });
      }

      gruposTransacoes.at(-1).transacoes.push(transacao);
    }

    return gruposTransacoes;
  }

  registrarTransacao(novaTransacao: Transacao): void {
    if (novaTransacao.tipoTransacao == TipoTransacao.DEPOSITO) {
      this.depositar(novaTransacao.valor);
    } 
    else if (novaTransacao.tipoTransacao == TipoTransacao.TRANSFERENCIA || novaTransacao.tipoTransacao == TipoTransacao.PAGAMENTO_BOLETO) {
      this.debitar(novaTransacao.valor);
      novaTransacao.valor *= -1;
    } 
    else {
      throw new Error("Tipo de Transação inválido!");
    }

    this.transacoes.push(novaTransacao);
    Armazenador.salvar("transacoes", JSON.stringify(this.transacoes));
  }
}

export class ContaPremium extends Conta {
  registrarTransacao(novaTransacao: Transacao): void {
    if (novaTransacao.tipoTransacao === TipoTransacao.DEPOSITO) {
      console.log("Ganhou um bônus e 0.50 centavos.");
      novaTransacao.valor += 0.5;
    }

    super.registrarTransacao(novaTransacao);
  }
}

const conta = new Conta("Joana da Silva Oliveira");
const contaPremium = new ContaPremium("Caio Ikena");

export default conta;
