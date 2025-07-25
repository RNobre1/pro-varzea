
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tables } from "@/integrations/supabase/types";
import { calculateOdds } from "@/utils/oddsCalculator";
import { generateTeams } from "@/utils/teamFormation";
import { useAuth } from "@/hooks/useAuth";
import BilheteAposta from "./BilheteAposta";
import { Trophy, Calendar, Users } from "lucide-react";
import { Selecao } from '@/types/apostas';

interface MercadosApostaProps {
  jogadores: Tables<"players">[];
  partida: Tables<"partidas"> | null;
}

const MercadosAposta: React.FC<MercadosApostaProps> = ({ jogadores, partida }) => {
  const { profile } = useAuth();
  const [selecoes, setSelecoes] = useState<Selecao[]>([]);
  const [odds, setOdds] = useState<any>(null);
  const [escalacoes, setEscalacoes] = useState<any>(null);

  useEffect(() => {
    if (jogadores.length > 0 && partida) {
      // Gerar escalações
      const teams = generateTeams(jogadores);
      setEscalacoes(teams);

      // Calcular odds baseadas nas escalações
      const calculatedOdds = calculateOdds(teams.timeA.jogadores, teams.timeB.jogadores, jogadores);
      setOdds(calculatedOdds);
    }
  }, [jogadores, partida]);

  const adicionarSelecao = (categoria: string, detalhe: string, odd: number, descricao: string, jogadorAlvo?: Tables<"players">) => {
    if (!partida) return;
    
    // Verificar se usuário não está apostando em si mesmo
    if (jogadorAlvo && profile?.user_id) {
      const jogadorDoUsuario = jogadores.find(j => j.user_id === profile.user_id);
      if (jogadorDoUsuario && jogadorAlvo.id === jogadorDoUsuario.id) {
        alert('Você não pode apostar em si mesmo!');
        return;
      }
    }

    const novaSelecao: Selecao = {
      id: crypto.randomUUID(),
      partida_id: partida.partida_id,
      categoria,
      detalhe,
      descricao,
      odd,
      jogador_id: jogadorAlvo?.id || null
    };

    // Verificar conflitos (mesma categoria + detalhe)
    const conflito = selecoes.find(s => 
      s.categoria === categoria && 
      s.detalhe.split('_')[0] === detalhe.split('_')[0]
    );

    if (conflito) {
      // Substituir seleção conflitante
      setSelecoes(prev => prev.map(s => 
        s.categoria === categoria && s.detalhe.split('_')[0] === detalhe.split('_')[0]
          ? novaSelecao 
          : s
      ));
    } else {
      setSelecoes(prev => [...prev, novaSelecao]);
    }
  };

  const removerSelecao = (id: string) => {
    setSelecoes(prev => prev.filter(s => s.id !== id));
  };

  const limparBilhete = () => {
    setSelecoes([]);
  };

  if (!partida) {
    return (
      <div className="text-center p-8">
        <Calendar className="w-16 h-16 mx-auto text-gray-400 mb-4" />
        <h3 className="text-xl font-semibold text-gray-600 mb-2">Nenhuma partida agendada</h3>
        <p className="text-gray-500">Aguarde o administrador agendar a próxima partida.</p>
      </div>
    );
  }

  if (!odds || !escalacoes) {
    return (
      <div className="text-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Calculando odds...</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Mercados de Apostas */}
      <div className="lg:col-span-2 space-y-6">
        {/* Info da Partida */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              {partida.time_a_nome} vs {partida.time_b_nome}
            </CardTitle>
            <p className="text-sm text-gray-600">
              {new Date(partida.data_partida).toLocaleString('pt-BR')}
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <h4 className="font-semibold">{escalacoes.timeA.nome}</h4>
                <p className="text-sm text-gray-600">Formação: {escalacoes.timeA.formacao}</p>
                <p className="text-lg font-bold text-green-600">
                  Nota: {escalacoes.timeA.notaTotal.toFixed(1)}
                </p>
              </div>
              <div className="text-center">
                <h4 className="font-semibold">{escalacoes.timeB.nome}</h4>
                <p className="text-sm text-gray-600">Formação: {escalacoes.timeB.formacao}</p>
                <p className="text-lg font-bold text-blue-600">
                  Nota: {escalacoes.timeB.notaTotal.toFixed(1)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Resultado da Partida */}
        <Card>
          <CardHeader>
            <CardTitle>Resultado da Partida</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant="outline"
                className="flex flex-col p-4 h-auto"
                onClick={() => adicionarSelecao(
                  'RESULTADO_PARTIDA',
                  'VITORIA_A',
                  odds.resultado.timeA,
                  `${partida.time_a_nome} para Vencer`
                )}
              >
                <span className="text-sm">{partida.time_a_nome}</span>
                <span className="text-lg font-bold">{odds.resultado.timeA.toFixed(2)}</span>
              </Button>
              
              <Button
                variant="outline"
                className="flex flex-col p-4 h-auto"
                onClick={() => adicionarSelecao(
                  'RESULTADO_PARTIDA',
                  'EMPATE',
                  odds.resultado.empate,
                  'Empate'
                )}
              >
                <span className="text-sm">Empate</span>
                <span className="text-lg font-bold">{odds.resultado.empate.toFixed(2)}</span>
              </Button>
              
              <Button
                variant="outline"
                className="flex flex-col p-4 h-auto"
                onClick={() => adicionarSelecao(
                  'RESULTADO_PARTIDA',
                  'VITORIA_B',
                  odds.resultado.timeB,
                  `${partida.time_b_nome} para Vencer`
                )}
              >
                <span className="text-sm">{partida.time_b_nome}</span>
                <span className="text-lg font-bold">{odds.resultado.timeB.toFixed(2)}</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Mercados de Jogadores */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Mercados de Jogadores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {odds.jogadores.map((jogadorOdds: any) => {
                const jogador = jogadores.find(j => j.id === jogadorOdds.id);
                if (!jogador) return null;

                const isOwnPlayer = profile?.user_id && jogador.user_id === profile.user_id;

                return (
                  <div key={jogador.id} className={`p-4 border rounded-lg ${isOwnPlayer ? 'bg-red-50 border-red-200' : ''}`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">{jogador.jogador}</h4>
                        {isOwnPlayer && <Badge variant="destructive">Você</Badge>}
                      </div>
                      <Badge variant="outline">
                        Nota: {jogador.nota.toFixed(1)}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {/* Gols */}
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={isOwnPlayer}
                        onClick={() => adicionarSelecao(
                          'MERCADO_JOGADOR',
                          `GOLS_MAIS_0.5_${jogador.id}`,
                          jogadorOdds.gols_0_5,
                          `${jogador.jogador} +0.5 Gols`,
                          jogador
                        )}
                      >
                        <div className="text-center">
                          <div className="text-xs">+0.5 Gols</div>
                          <div className="font-bold">{jogadorOdds.gols_0_5.toFixed(2)}</div>
                        </div>
                      </Button>

                      {/* Assistências */}
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={isOwnPlayer}
                        onClick={() => adicionarSelecao(
                          'MERCADO_JOGADOR',
                          `ASSIST_MAIS_0.5_${jogador.id}`,
                          jogadorOdds.assistencias_0_5,
                          `${jogador.jogador} +0.5 Assist`,
                          jogador
                        )}
                      >
                        <div className="text-center">
                          <div className="text-xs">+0.5 Assist</div>
                          <div className="font-bold">{jogadorOdds.assistencias_0_5.toFixed(2)}</div>
                        </div>
                      </Button>

                      {/* Desarmes (se aplicável) */}
                      {jogador.desarmes > 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={isOwnPlayer}
                          onClick={() => adicionarSelecao(
                            'MERCADO_JOGADOR',
                            `DESARMES_MAIS_1.5_${jogador.id}`,
                            jogadorOdds.desarmes_1_5,
                            `${jogador.jogador} +1.5 Desarmes`,
                            jogador
                          )}
                        >
                          <div className="text-center">
                            <div className="text-xs">+1.5 Desarmes</div>
                            <div className="font-bold">{jogadorOdds.desarmes_1_5.toFixed(2)}</div>
                          </div>
                        </Button>
                      )}

                      {/* Defesas (se aplicável) */}
                      {jogador.defesas > 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={isOwnPlayer}
                          onClick={() => adicionarSelecao(
                            'MERCADO_JOGADOR',
                            `DEFESAS_MAIS_2.5_${jogador.id}`,
                            jogadorOdds.defesas_2_5,
                            `${jogador.jogador} +2.5 Defesas`,
                            jogador
                          )}
                        >
                          <div className="text-center">
                            <div className="text-xs">+2.5 Defesas</div>
                            <div className="font-bold">{jogadorOdds.defesas_2_5.toFixed(2)}</div>
                          </div>
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bilhete de Aposta */}
      <div className="lg:col-span-1">
        <BilheteAposta 
          selecoes={selecoes}
          onRemoverSelecao={removerSelecao}
          onLimparBilhete={limparBilhete}
        />
      </div>
    </div>
  );
};

export default MercadosAposta;
