import type { Request, Response } from "express";
import * as svc from "../services/estoque.service";

export async function list(_req: Request, res: Response) {
  const rows = await svc.listEstoqueAtual();
  return res.status(200).json(rows);
}
