-- Fornecedor: inativação sem exclusão (requisito Batmotor)
ALTER TABLE `Fornecedor` ADD COLUMN `ativo` BOOLEAN NOT NULL DEFAULT true;

-- Movimentação: tipo AJUSTE (correção de inventário)
ALTER TABLE `Movimentacao` MODIFY COLUMN `tipo` ENUM('ENTRADA', 'SAIDA', 'AJUSTE') NOT NULL;
