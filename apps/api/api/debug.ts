{
              const mod = await import("../src/create-app");
              res.end("create-app OK: " + Object.keys(mod).join(","));
      } catch (e) {
              const err = e as { message?: string; stack?: string };
              res.statusCode = 500;
              res.end("FALLO: " + (err?.message || String(e)) + "\n" + (err?.stack || "").slice(0, 900));
      }
