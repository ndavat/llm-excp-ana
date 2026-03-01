import { router, publicProcedure, protectedProcedure } from './trpc';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { exceptions, analysisResults, emailLogs } from '../db/schema';
import { desc, eq } from 'drizzle-orm';
import { invokeLLM, notifyOwner } from '../services/llm';
import { db } from '../db/client';

export const exceptionsRouter = router({
  trigger: protectedProcedure
    .input(z.enum([
      'NullReferenceException', 
      'DivideByZeroException', 
      'ArgumentException', 
      'IndexOutOfRangeException', 
      'InvalidOperationException', 
      'FileNotFoundException'
    ]))
    .mutation(async ({ input, ctx }) => {
      const exceptionDetails = {
        NullReferenceException: {
          message: "Object reference not set to an instance of an object.",
          stackTrace: "at System.Web.Mvc.Controller.InvokeAction\nat MyApp.Services.UserService.GetById(Int32 id)\nat MyApp.Controllers.UserController.Details(Int32 id)",
          simulatedCode: "User user = null;\nvar name = user.Name;"
        },
        DivideByZeroException: {
          message: "Attempted to divide by zero.",
          stackTrace: "at MyApp.Calculators.Finance.CalculateRatio(Double value)\nat MyApp.Pages.Index.OnGet()",
          simulatedCode: "int a = 10, b = 0;\nint c = a / b;"
        },
        ArgumentException: {
          message: "The parameter 'id' cannot be less than or equal to zero.",
          stackTrace: "at MyApp.Repositories.BaseRepository.ValidateId(Int32 id)\nat MyApp.Repositories.UserRepository.Find(Int32 id)",
          simulatedCode: "public void Find(int id) {\n  if (id <= 0) throw new ArgumentException(\"id\");\n}"
        },
        IndexOutOfRangeException: {
          message: "Index was outside the bounds of the array.",
          stackTrace: "at MyApp.DataProcessing.ArrayUtils.GetElement(Int32[] arr, Int32 index)\nat MyApp.Services.ReportGenerator.Generate(Int32[] ids)",
          simulatedCode: "var arr = new int[5];\nvar item = arr[10];"
        },
        InvalidOperationException: {
          message: "Sequence contains no elements.",
          stackTrace: "at System.Linq.Enumerable.First[TSource](IEnumerable`1 source)\nat MyApp.Queries.UserQueries.GetActiveUser()",
          simulatedCode: "var users = new List<User>();\nvar user = users.First();"
        },
        FileNotFoundException: {
          message: "Could not find file 'C:\\data\\config.json'.",
          stackTrace: "at System.IO.FileStream.OpenHandle(FileMode mode, FileShare share, FileOptions options)\nat System.IO.FileStream..ctor(String path, FileMode mode, FileAccess access)",
          simulatedCode: "using (var stream = File.OpenRead(\"config.json\")) { ... }"
        }
      }[input];

      const [result] = await db.insert(exceptions).values({
        exceptionType: input,
        message: exceptionDetails.message,
        stackTrace: exceptionDetails.stackTrace,
        simulatedCode: exceptionDetails.simulatedCode,
        triggeredBy: ctx.user.id,
      });

      return {
        success: true,
        exceptionId: (result as any).insertId,
        message: `Triggered ${input} successfully`
      };
    }),

  list: publicProcedure
    .input(z.object({
      limit: z.number().default(20),
      offset: z.number().default(0),
    }))
    .query(async ({ input }) => {
      return db.query.exceptions.findMany({
        limit: input.limit,
        offset: input.offset,
        orderBy: [desc(exceptions.createdAt)],
      });
    }),

  latest: publicProcedure.query(async () => {
    return db.query.exceptions.findFirst({
      orderBy: [desc(exceptions.createdAt)],
      with: {
        analysisResults: true
      }
    });
  }),

  getById: publicProcedure
    .input(z.number())
    .query(async ({ input }) => {
      return db.query.exceptions.findFirst({
        where: eq(exceptions.id, input),
        with: {
          analysisResults: true
        }
      });
    }),

  analyzeLatest: protectedProcedure.mutation(async ({ ctx }) => {
    const latest = await db.query.exceptions.findFirst({
      orderBy: [desc(exceptions.createdAt)],
    });

    if (!latest) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'No exceptions found to analyze' });
    }

    const prompt = `Analyze this .NET exception:
Type: ${latest.exceptionType}
Message: ${latest.message}
Stack Trace: ${latest.stackTrace}
Simulated Code: ${latest.simulatedCode}

Provide a structured JSON response with:
- rootCause (string)
- solutions (array of 3-5 strings)
- bestPractices (string)`;

    const llmResponseRaw = await invokeLLM(prompt, { response_format: 'json_object' });
    const llmResponse = JSON.parse(llmResponseRaw);

    const [analysisResult] = await db.insert(analysisResults).values({
      exceptionId: latest.id,
      rootCause: llmResponse.rootCause,
      solutions: JSON.stringify(llmResponse.solutions),
      recommendations: llmResponse.bestPractices,
    });

    const analysisId = (analysisResult as any).insertId;

    try {
      await notifyOwner(latest.exceptionType, latest.message, ctx.user.email);
      await db.insert(emailLogs).values({
        exceptionId: latest.id,
        analysisId: analysisId,
        recipientEmail: ctx.user.email,
        subject: `Analysis for ${latest.exceptionType}`,
        status: 'sent',
      });
    } catch (error: any) {
      await db.insert(emailLogs).values({
        exceptionId: latest.id,
        analysisId: analysisId,
        recipientEmail: ctx.user.email,
        subject: `Analysis for ${latest.exceptionType}`,
        status: 'failed',
        errorMessage: error.message,
      });
    }

    return {
      success: true,
      message: 'Analysis completed successfully',
      analysis: {
        rootCause: llmResponse.rootCause,
        solutions: llmResponse.solutions,
        bestPractices: llmResponse.bestPractices,
      }
    };
  }),
});
