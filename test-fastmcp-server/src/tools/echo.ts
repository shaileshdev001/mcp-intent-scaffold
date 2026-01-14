import { z } from 'zod';

export const echoTool = {
  name: 'echo',
  description: 'Echo back the input message',
  parameters: z.object({
    message: z.string().describe('The message to echo back'),
  }),
  execute: async (args: { message: string }) => {
    return `Echo: ${args.message}`;
  },
};
