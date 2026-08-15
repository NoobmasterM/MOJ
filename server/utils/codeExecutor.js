import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import os from 'os';

const execPromise = promisify(exec);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const tmpDir = os.tmpdir();

const LANGUAGES = {
  javascript: {
    ext: 'js',
    compile: null,
    run: (filename) => `node "${filename}"`,
    timeout: 5000
  },
  python: {
    ext: 'py',
    compile: null,
    run: (filename) => `python "${filename}"`,
    timeout: 5000
  },
  cpp: {
    ext: 'cpp',
    compile: (filename) => `g++ "${filename}" -o "${filename.replace('.cpp', '')}"`,
    run: (filename) => `"${filename.replace('.cpp', '')}"`,
    timeout: 5000
  },
  c: {
    ext: 'c',
    compile: (filename) => `gcc "${filename}" -o "${filename.replace('.c', '')}"`,
    run: (filename) => `"${filename.replace('.c', '')}"`,
    timeout: 5000
  },
  java: {
    ext: 'java',
    compile: (filename) => `javac "${filename}"`,
    run: (filename) => `java -cp "${path.dirname(filename)}" ${path.basename(filename).replace('.java', '')}`,
    timeout: 5000
  }
};

export async function executeCode(code, language = 'javascript', input = '') {
  try {
    if (!LANGUAGES[language]) {
      return {
        status: 'error',
        output: '',
        error: `Language "${language}" is not supported`,
        executionTime: 0
      };
    }

    const langConfig = LANGUAGES[language];
    const filename = path.join(tmpDir, `code_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${langConfig.ext}`);
    
    try {
      fs.writeFileSync(filename, code);
      const startTime = Date.now();
      let output = '';
      let error = '';
      let status = 'accepted';

      if (langConfig.compile) {
        try {
          await execPromise(langConfig.compile(filename), { timeout: langConfig.timeout });
        } catch (compileError) {
          return {
            status: 'error',
            output: '',
            error: `Compilation Error: ${compileError.message}`,
            executionTime: Date.now() - startTime
          };
        }
      }

      try {
        const runCommand = langConfig.run(filename);
        const { stdout, stderr } = await execPromise(runCommand, { 
          timeout: langConfig.timeout,
          encoding: 'utf-8',
          shell: true
        });

        output = stdout.trim();
        if (stderr) {
          error = stderr.trim();
        }
      } catch (runError) {
        if (runError.killed) {
          error = 'Time Limit Exceeded';
          status = 'failed';
        } else if (runError.signal) {
          error = `Runtime Error: ${runError.message}`;
          status = 'failed';
        } else {
          output = runError.stdout ? runError.stdout.trim() : '';
          error = runError.stderr ? runError.stderr.trim() : runError.message;
          status = 'failed';
        }
      }

      const executionTime = Date.now() - startTime;

      return {
        status: error ? 'failed' : status,
        output,
        error: error || null,
        executionTime
      };
    } finally {
      try {
        fs.unlinkSync(filename);
        if (langConfig.compile) {
          const exePath = filename.replace(`.${langConfig.ext}`, '');
          if (fs.existsSync(exePath)) {
            fs.unlinkSync(exePath);
          }
        }
      } catch (cleanupError) {
        console.error('Cleanup error:', cleanupError);
      }
    }
  } catch (error) {
    return {
      status: 'error',
      output: '',
      error: `Execution Error: ${error.message}`,
      executionTime: 0
    };
  }
}

export default executeCode;
