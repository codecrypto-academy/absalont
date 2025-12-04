'use client';

import React, { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { useWallet } from '@/context/WalletContext';
import { ESCROW_ADDRESS, ESCROW_ABI, ERC20_ABI } from '@/lib/constants';
import { ErrorAlert } from '@/components/ErrorAlert';
import { formatErrorDisplay, logError, sleep } from '@/lib/errorUtils';

interface OperationData {
  initiator: string;
  recipient: string;
  amountA: bigint;
  amountB: bigint;
  tokenA: string;
  tokenB: string;
  status: number;
  createdAt: bigint;
}

interface OperationDisplay {
  id: number;
  initiator: string;
  recipient: string;
  amountA: string;
  amountB: string;
  tokenA: string;
  tokenB: string;
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
  createdAt: bigint;
  isCreator: boolean;
}

export function OperationsList() {
  const { signer, provider, account } = useWallet();
  const [operations, setOperations] = useState<OperationDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<{ title: string; message: string } | null>(null);
  const [completing, setCompleting] = useState<number | null>(null);
  const [cancelling, setCancelling] = useState<number | null>(null);

  // Auto-refresh cada 5 segundos
  useEffect(() => {
    loadOperations();
    const interval = setInterval(loadOperations, 5000);
    return () => clearInterval(interval);
  }, [provider, account]);

  // Cargar todas las operaciones
  const loadOperations = async () => {
    if (!provider) return;

    try {
      setError(null);
      const escrowContract = new ethers.Contract(
        ESCROW_ADDRESS,
        ESCROW_ABI,
        provider
      );

      // Obtener todas las operaciones (con fallback a array vacío si falla)
      let allOps: OperationData[] = [];
      try {
        allOps = await escrowContract.getAllOperations();
      } catch (err) {
        logError('OperationsList: getAllOperations fallback', err);
        // Continuar con array vacío si falla
        allOps = [];
      }

      // Procesar operaciones
      const processed = allOps.map((op: OperationData, index: number) => {
        const statusMap: { [key: number]: 'PENDING' | 'COMPLETED' | 'CANCELLED' } = {
          0: 'PENDING',
          1: 'COMPLETED',
          2: 'CANCELLED',
        };

        return {
          id: index,
          initiator: op.initiator,
          recipient: op.recipient,
          amountA: ethers.formatEther(op.amountA),
          amountB: ethers.formatEther(op.amountB),
          tokenA: op.tokenA,
          tokenB: op.tokenB,
          status: statusMap[op.status] || 'PENDING',
          createdAt: op.createdAt,
          isCreator: account?.toLowerCase() === op.initiator.toLowerCase(),
        };
      });

      setOperations(processed);
      setLoading(false);
    } catch (err) {
      logError('OperationsList: loadOperations', err);
      const { title, message } = formatErrorDisplay(err);
      setError({ title, message });
      setOperations([]); // Usar array vacío como fallback
      setLoading(false);
    }
  };

  // Paso 1: Aprobar Token B
  const approveTokenB = async (operation: OperationDisplay): Promise<boolean> => {
    try {
      if (!signer) {
        setError({
          title: '⚠️ Wallet Desconectada',
          message: 'Por favor, conecta tu wallet primero.',
        });
        return false;
      }

      const tokenContract = new ethers.Contract(
        operation.tokenB,
        ERC20_ABI,
        signer
      );

      let amount;
      try {
        amount = ethers.parseEther(operation.amountB);
      } catch (err) {
        logError('OperationsList: parseUnits Token B', err);
        setError({
          title: '⚠️ Monto Inválido',
          message: 'No se pudo procesar el monto del Token B.',
        });
        return false;
      }

      // Verificar allowance actual
      const currentAllowance = await tokenContract.allowance(account, ESCROW_ADDRESS);

      if (currentAllowance >= amount) {
        return true; // Ya está aprobado
      }

      // Hacer approve
      const tx = await tokenContract.approve(ESCROW_ADDRESS, amount);
      await tx.wait();

      return true;
    } catch (err) {
      logError('OperationsList: approveTokenB', err);
      const { title, message } = formatErrorDisplay(err);
      setError({ title, message });
      return false;
    }
  };

  // Paso 2: Completar operación
  const completeOperationCall = async (
    operationId: number,
    operation: OperationDisplay
  ): Promise<boolean> => {
    try {
      if (!signer) {
        setError({
          title: '⚠️ Wallet Desconectada',
          message: 'Por favor, conecta tu wallet primero.',
        });
        return false;
      }

      const escrowContract = new ethers.Contract(
        ESCROW_ADDRESS,
        ESCROW_ABI,
        signer
      );

      let amountB;
      try {
        amountB = ethers.parseEther(operation.amountB);
      } catch (err) {
        logError('OperationsList: parseUnits para completeOperation', err);
        setError({
          title: '⚠️ Monto Inválido',
          message: 'No se pudo procesar el monto de Token B.',
        });
        return false;
      }

      // Completar operación
      const tx = await escrowContract.completeOperation(operationId, amountB);
      await tx.wait();

      return true;
    } catch (err) {
      logError('OperationsList: completeOperationCall', err);
      const { title, message } = formatErrorDisplay(err);
      setError({ title, message });
      return false;
    }
  };

  // Manejar Complete Operation (approve + completeOperation en un paso)
  const handleComplete = async (operationId: number, operation: OperationDisplay) => {
    try {
      setCompleting(operationId);
      setError(null);

      // Paso 1: Aprobar Token B
      const approved = await approveTokenB(operation);
      if (!approved) {
        setCompleting(null);
        return;
      }

      // Pequeña pausa para asegurar confirmación
      await sleep(1000);

      // Paso 2: Completar operación
      const completed = await completeOperationCall(operationId, operation);

      if (completed) {
        // Recargar operaciones
        await sleep(1000);
        await loadOperations();
      }

      setCompleting(null);
    } catch (err) {
      logError('OperationsList: handleComplete', err);
      const { title, message } = formatErrorDisplay(err);
      setError({ title, message });
      setCompleting(null);
    }
  };

  // Cancelar operación (solo creador)
  const handleCancel = async (operationId: number) => {
    try {
      setCancelling(operationId);
      setError(null);

      if (!signer) {
        setError({
          title: '⚠️ Wallet Desconectada',
          message: 'Por favor, conecta tu wallet primero.',
        });
        setCancelling(null);
        return;
      }

      const escrowContract = new ethers.Contract(
        ESCROW_ADDRESS,
        ESCROW_ABI,
        signer
      );

      const tx = await escrowContract.cancelOperation(operationId);
      await tx.wait();

      // Recargar operaciones
      await sleep(1000);
      await loadOperations();

      setCancelling(null);
    } catch (err) {
      logError('OperationsList: handleCancel', err);
      const { title, message } = formatErrorDisplay(err);
      setError({ title, message });
      setCancelling(null);
    }
  };

  // Truncar dirección
  const truncateAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  // Estado de carga
  if (loading) {
    return (
      <div className="w-full bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">📋 Operaciones Activas</h2>
        <div className="text-center py-12">
          <p className="text-gray-500">⏳ Cargando operaciones...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">📋 Operaciones Activas</h2>

      {/* Error Alert */}
      {error && (
        <ErrorAlert
          title={error.title}
          message={error.message}
          type="error"
          onClose={() => setError(null)}
        />
      )}

      {/* Empty State */}
      {operations.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <p className="text-gray-500 text-lg font-medium">📭 No hay operaciones activas</p>
          <p className="text-gray-400 text-sm mt-2">Crea una nueva operación para comenzar</p>
        </div>
      ) : (
        <div className="space-y-4">
          {operations.map((op) => (
            <div
              key={op.id}
              className={`border rounded-lg p-6 transition-colors ${
                op.status === 'PENDING'
                  ? 'border-yellow-200 bg-yellow-50'
                  : op.status === 'COMPLETED'
                    ? 'border-green-200 bg-green-50'
                    : 'border-red-200 bg-red-50'
              }`}
            >
              {/* Header - ID y Estado */}
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-xs font-semibold text-gray-600 uppercase">
                    Operación #{op.id}
                  </p>
                  <p className="text-lg font-bold text-gray-800">
                    {op.status === 'PENDING'
                      ? '⏳ Pendiente'
                      : op.status === 'COMPLETED'
                        ? '✅ Completada'
                        : '❌ Cancelada'}
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    op.status === 'PENDING'
                      ? 'bg-yellow-200 text-yellow-800'
                      : op.status === 'COMPLETED'
                        ? 'bg-green-200 text-green-800'
                        : 'bg-red-200 text-red-800'
                  }`}
                >
                  {op.status}
                </span>
              </div>

              {/* Participantes */}
              <div className="mb-4 p-3 bg-white bg-opacity-60 rounded">
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <div>
                    <p className="text-xs text-gray-600 font-semibold">👤 Creador</p>
                    <p className="font-mono text-sm text-gray-800">
                      {truncateAddress(op.initiator)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 font-semibold">👥 Destinatario</p>
                    <p className="font-mono text-sm text-gray-800">
                      {truncateAddress(op.recipient)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Tokens e Información */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                {/* Token A */}
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                  <p className="text-xs text-gray-600 font-semibold uppercase mb-2">
                    🔄 Token A
                  </p>
                  <p className="text-lg font-bold text-blue-600">{op.amountA}</p>
                  <p className="font-mono text-xs text-gray-500 truncate mt-1">
                    {truncateAddress(op.tokenA)}
                  </p>
                </div>

                {/* Token B */}
                <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
                  <p className="text-xs text-gray-600 font-semibold uppercase mb-2">
                    🔄 Token B
                  </p>
                  <p className="text-lg font-bold text-purple-600">{op.amountB}</p>
                  <p className="font-mono text-xs text-gray-500 truncate mt-1">
                    {truncateAddress(op.tokenB)}
                  </p>
                </div>
              </div>

              {/* Acciones */}
              {op.status === 'PENDING' && (
                <div className="flex gap-3">
                  {op.isCreator ? (
                    <>
                      <button
                        onClick={() => handleCancel(op.id)}
                        disabled={cancelling === op.id || !signer}
                        className={`flex-1 py-3 px-4 rounded-lg font-semibold text-white transition-colors ${
                          cancelling === op.id || !signer
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-red-600 hover:bg-red-700 active:bg-red-800'
                        }`}
                      >
                        {cancelling === op.id ? '⏳ Cancelando...' : '❌ Cancelar'}
                      </button>
                      <p className="flex-1 py-3 px-4 rounded-lg text-xs text-gray-600 bg-gray-100 flex items-center">
                        ℹ️ Eres el creador
                      </p>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => handleComplete(op.id, op)}
                        disabled={completing === op.id || !signer}
                        className={`flex-1 py-3 px-4 rounded-lg font-semibold text-white transition-colors ${
                          completing === op.id || !signer
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-green-600 hover:bg-green-700 active:bg-green-800'
                        }`}
                      >
                        {completing === op.id
                          ? '⏳ Completando...'
                          : '✅ Completar'}
                      </button>
                      <p className="flex-1 py-3 px-4 rounded-lg text-xs text-gray-600 bg-gray-100 flex items-center">
                        ℹ️ Aprobar + Completar
                      </p>
                    </>
                  )}
                </div>
              )}

              {op.status !== 'PENDING' && (
                <div className="p-3 bg-gray-100 rounded-lg text-center">
                  <p className="text-xs text-gray-600 font-semibold">
                    {op.status === 'COMPLETED'
                      ? '✅ Operación completada'
                      : '❌ Operación cancelada'}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Info Footer */}
      {operations.length > 0 && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs text-blue-900">
            <strong>ℹ️ Auto-actualización:</strong> Se refresca cada 5 segundos. Como creador
            puedes cancelar, como otro usuario puedes completar la operación.
          </p>
        </div>
      )}
    </div>
  );
}
