import type { Request, Response } from "express";

export const loginUser = async(req : Request, res : Response) => {
  const {email, password} = req.body();
}