import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import os from 'os';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const tmpDir = os.tmpdir();
const isWindows = os.platform() === 'win32';

const LANGUAGES = {
  javascript: {
    ext: 'js',
    compile: null,
    run: (filename) => ({ cmd: 'node', args: [filename] }),
    timeout: 5000
  },
  python: {
    ext: 'py',
    compile: null,
    run: (filename) => ({ cmd: 'python', args: [filename] }),
    timeout: 5000
  },
  cpp: {
    ext: 'cpp',
    compile: (filename) => {
      const out = filename.replace('.cpp', isWindows ? '.exe' : '');
      return { cmd: 'g++', args: [filename, '-o', out] };
    },
    run: (filename) => ({ cmd: filename.replace('.cpp', isWindows ? '.exe' : ''), args: [] }),
    timeout: 5000
  },
  c: {
    ext: 'c',
    compile: (filename) => {
      const out = filename.replace('.c', isWindows ? '.exe' : '');
      return { cmd: 'gcc', args: [filename, '-o', out] };
    },
    run: (filename) => ({ cmd: filename.replace('.c', isWindows ? '.exe' : ''), args: [] }),
    timeout: 5000
  },
  java: {
    ext: 'java',
    compile: (filename) => ({ cmd: 'javac', args: [filename] }),
    run: (filename) => {
      const className = path.basename(filename, '.java');
      return { cmd: 'java', args: ['-cp', path.dirname(filename), className] };
    },
    timeout: 5000
  }
};

export async function executeCode(code, language = 'javascript', input = '') {
  if (!LANGUAGES[language]) {
    return { status: 'error', output: '', error: `Language "${language}" is not supported`, executionTime: 0 };
  }

  const langConfig = LANGUAGES[language];
  const filename = path.join(tmpDir, `code_${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${langConfig.ext}`);
  const baseExePath = filename.replace(`.${langConfig.ext}`, '');
  const exePath = isWindows && (language === 'c' || language === 'cpp') ? `${baseExePath}.exe` : baseExePath;

  const className = path.basename(filename, '.java');

  if (language === 'java') {
  // Regex to look for "class YourClassName" and dynamically swap it with the random file ID
    code = code.replace(/(class\s+)[A-Za-z0-9_]+/g, `$1${className}`);
  }

  try {
    fs.writeFileSync(filename, code);
    const startTime = Date.now();


    if (langConfig.compile) {
      const compSpec = langConfig.compile(filename);
      const compilation = await new Promise((resolve) => {
        const proc = spawn(compSpec.cmd, compSpec.args, { shell: true });
        let stderr = '';
        proc.stderr.on('data', (data) => { stderr += data.toString(); });
        proc.on('close', (code) => resolve({ success: code === 0, error: stderr }));
      });

      if (!compilation.success) {
        return {
          status: 'error',
          output: '',
          error: `Compilation Error:\n${compilation.error}`,
          executionTime: Date.now() - startTime
        };
      }
    }


    const runSpec = langConfig.run(filename);
    const result = await new Promise((resolve) => {
      const child = spawn(runSpec.cmd, runSpec.args, { shell: true });
      let stdout = '';
      let stderr = '';
      let killedDueToTimeout = false;

      const timer = setTimeout(() => {
        killedDueToTimeout = true;
        child.kill();
      }, langConfig.timeout);

      if (child.stdin) {
        child.stdin.write(typeof input === 'string' ? input : String(input ?? ''));
        child.stdin.end();
      }

      child.stdout.on('data', (data) => { stdout += data.toString(); });
      child.stderr.on('data', (data) => { stderr += data.toString(); });

      child.on('close', (code) => {
        clearTimeout(timer);
        if (killedDueToTimeout) {
          resolve({ status: 'failed', output: '', error: 'Time Limit Exceeded' });
        } else {
          resolve({
            status: (code === 0 && !stderr) ? 'accepted' : 'failed',
            output: stdout.trim(),
            error: stderr.trim() || null
          });
        }
      });
    });

    return {
      ...result,
      executionTime: Date.now() - startTime
    };

  } catch (globalError) {
    return { status: 'error', output: '', error: `Execution Error: ${globalError.message}`, executionTime: 0 };
  } finally {
    
    try {
      if (fs.existsSync(filename)) fs.unlinkSync(filename);
      if (fs.existsSync(exePath)) fs.unlinkSync(exePath);
      if (language === 'java') {
        const classFile = filename.replace('.java', '.class');
        if (fs.existsSync(classFile)) fs.unlinkSync(classFile);
      }
    } catch (cleanupError) {
      console.error('Cleanup warning:', cleanupError);
    }
  }
}

export default executeCode;
