import { z } from "zod";

const esquema = z.object({
  API_URL: z.url({ message: "API_URL deve ser uma URL absoluta válida." }),
  SITE_URL: z.url({ message: "SITE_URL deve ser uma URL absoluta válida." }),
});

const resultado = esquema.safeParse(process.env);
if (!resultado.success) {
  throw new Error(`Configuração de ambiente inválida: ${resultado.error.issues.map((issue) => issue.message).join(" ")}`);
}

export const env = resultado.data;
