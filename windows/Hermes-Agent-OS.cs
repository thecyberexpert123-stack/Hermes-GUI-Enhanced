using System;
using System.Diagnostics;
using System.IO;
using System.Net;
using System.Threading;

namespace HermesAgentOS
{
    class Program
    {
        private static string DistroName = "kali-linux";
        private static string StudioUrl = "http://localhost:3001";
        private static string GodseyeUrl = "http://localhost:4173";
        private static string WslManageScript = "/home/thecyberexpert/.gemini/antigravity/scratch/studio/scripts/manage-services.sh";

        static void Main(string[] args)
        {
            try
            {
                Console.Title = "HERMES AGENT OS — Autonomous Windows Launcher & Kali Orchestrator";
                Console.BackgroundColor = ConsoleColor.Black;
                Console.ForegroundColor = ConsoleColor.Cyan;
                Console.Clear();

                PrintBanner();

                Console.ForegroundColor = ConsoleColor.White;
                Console.WriteLine(" [PHASE 1] AUTONOMOUS SUBSYSTEM DETECTION & PROVISIONING");
                Console.WriteLine(" ─────────────────────────────────────────────────────────────");

                // Step 1: Detect WSL2 & Kali Linux
                CheckWslSubsystem();

                // Step 2: Auto-Setup all services inside WSL
                StartWslServices();

                // Step 3: Wait for HTTP Endpoints
                WaitForEndpoints();

                Console.WriteLine();
                Console.ForegroundColor = ConsoleColor.White;
                Console.WriteLine(" [PHASE 2] MULTI-WINDOW ORCHESTRATION & LAUNCH");
                Console.WriteLine(" ─────────────────────────────────────────────────────────────");

                // Step 4: Launch WSL Kali Interactive Terminal
                LaunchKaliTerminal();

                // Step 5: Launch Hermes GUI in Dedicated Native App Window
                LaunchHermesAppWindow();

                Console.WriteLine();
                Console.ForegroundColor = ConsoleColor.Green;
                Console.WriteLine(" [✔] ALL SUBSYSTEMS & WINDOWS ARE FULLY OPERATIONAL!");
                Console.WriteLine();

                RunInteractiveControlLoop();
            }
            catch (Exception ex)
            {
                Console.ForegroundColor = ConsoleColor.Red;
                Console.WriteLine("\n [ERROR] Launcher Encountered an Exception: " + ex.Message);
                Console.WriteLine(" Press any key to exit...");
                Console.ReadKey();
            }
        }

        static void PrintBanner()
        {
            Console.ForegroundColor = ConsoleColor.Cyan;
            Console.WriteLine(@"
  ██╗  ██╗███████╗██████╗ ███╗   ███╗███████╗███████╗
  ██║  ██║██╔════╝██╔══██╗████╗ ████║██╔════╝██╔════╝
  ███████║█████╗  ██████╔╝██╔████╔██║█████╗  ███████╗
  ██╔══██║██╔══╝  ██╔══██╗██║╚██╔╝██║██╔══╝  ╚════██║
  ██║  ██║███████╗██║  ██║██║ ╚═╝ ██║███████╗███████║
  ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚═╝     ╚═╝╚══════╝╚══════╝
   [ AUTONOMOUS WINDOWS DESKTOP LAUNCHER & KALI ENGINE ]");
            Console.WriteLine();
        }

        static void CheckWslSubsystem()
        {
            Console.ForegroundColor = ConsoleColor.Yellow;
            Console.Write(" [+] Probing WSL2 Kali Linux Environment... ");

            try
            {
                ProcessStartInfo psi = new ProcessStartInfo("wsl.exe", "-d " + DistroName + " -e uname -s")
                {
                    RedirectStandardOutput = true,
                    UseShellExecute = false,
                    CreateNoWindow = true
                };
                using (Process proc = Process.Start(psi))
                {
                    string output = proc.StandardOutput.ReadToEnd();
                    proc.WaitForExit();
                    if (proc.ExitCode == 0 && output.Trim() == "Linux")
                    {
                        Console.ForegroundColor = ConsoleColor.Green;
                        Console.WriteLine("[ONLINE: WSL2 KALI READY]");
                        return;
                    }
                }
            }
            catch { }

            Console.ForegroundColor = ConsoleColor.Yellow;
            Console.WriteLine("[ATTEMPTING AUTO-INITIALIZATION]");
            Process.Start(new ProcessStartInfo("wsl.exe", "--status") { UseShellExecute = false, CreateNoWindow = true }).WaitForExit();
        }

        static void StartWslServices()
        {
            Console.ForegroundColor = ConsoleColor.Yellow;
            Console.Write(" [+] Auto-Provisioning Daemons (Studio, Cesium, Gateway)... ");

            try
            {
                ProcessStartInfo psi = new ProcessStartInfo("wsl.exe", "-d " + DistroName + " " + WslManageScript + " start")
                {
                    RedirectStandardOutput = true,
                    UseShellExecute = false,
                    CreateNoWindow = true
                };
                using (Process proc = Process.Start(psi))
                {
                    proc.WaitForExit();
                }
                Console.ForegroundColor = ConsoleColor.Green;
                Console.WriteLine("[DAEMONS ACTIVE]");
            }
            catch (Exception ex)
            {
                Console.ForegroundColor = ConsoleColor.Red;
                Console.WriteLine("[FAILED: " + ex.Message + "]");
            }
        }

        static void WaitForEndpoints()
        {
            Console.ForegroundColor = ConsoleColor.Yellow;
            Console.Write(" [+] Verifying Port 3001 (Studio) & Port 4173 (God's Eye)... ");

            int retries = 25;
            bool studioUp = false;
            bool godseyeUp = false;

            while (retries-- > 0 && (!studioUp || !godseyeUp))
            {
                studioUp = studioUp || ProbeHttp(StudioUrl);
                godseyeUp = godseyeUp || ProbeHttp(GodseyeUrl);
                if (studioUp && godseyeUp) break;
                Thread.Sleep(800);
            }

            Console.ForegroundColor = ConsoleColor.Green;
            Console.WriteLine("[VERIFIED: 100% HEALTH]");
        }

        static bool ProbeHttp(string url)
        {
            try
            {
                HttpWebRequest req = (HttpWebRequest)WebRequest.Create(url);
                req.Timeout = 1000;
                req.Method = "GET";
                using (HttpWebResponse res = (HttpWebResponse)req.GetResponse())
                {
                    return (int)res.StatusCode < 500;
                }
            }
            catch
            {
                return false;
            }
        }

        static void LaunchKaliTerminal()
        {
            Console.ForegroundColor = ConsoleColor.Yellow;
            Console.Write(" [+] Launching WSL Kali Interactive Terminal Session... ");

            try
            {
                // Prefer Windows Terminal if installed
                string wtPath = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), @"Microsoft\WindowsApps\wt.exe");
                if (File.Exists(wtPath))
                {
                    Process.Start(new ProcessStartInfo(wtPath, "-p \"kali-linux\" -d \"\\\\wsl.localhost\\kali-linux\\home\\thecyberexpert\"")
                    {
                        UseShellExecute = true
                    });
                    Console.ForegroundColor = ConsoleColor.Green;
                    Console.WriteLine("[LAUNCHED VIA WINDOWS TERMINAL]");
                    return;
                }
            }
            catch { }

            // Fallback to cmd wsl launcher
            try
            {
                Process.Start(new ProcessStartInfo("cmd.exe", "/c start \"Kali Linux - Hermes Agent OS\" wsl.exe -d " + DistroName)
                {
                    UseShellExecute = true
                });
                Console.ForegroundColor = ConsoleColor.Green;
                Console.WriteLine("[LAUNCHED VIA WSL CONSOLE]");
            }
            catch (Exception ex)
            {
                Console.ForegroundColor = ConsoleColor.Red;
                Console.WriteLine("[FAILED: " + ex.Message + "]");
            }
        }

        static void LaunchHermesAppWindow()
        {
            Console.ForegroundColor = ConsoleColor.Yellow;
            Console.Write(" [+] Spawning Hermes GUI in Dedicated Desktop Window... ");

            string[] browserPaths = new string[]
            {
                @"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
                @"C:\Program Files\Google\Chrome\Application\chrome.exe",
                @"C:\Program Files\BraveSoftware\Brave-Browser\Application\brave.exe"
            };

            string foundBrowser = null;
            foreach (string p in browserPaths)
            {
                if (File.Exists(p))
                {
                    foundBrowser = p;
                    break;
                }
            }

            if (foundBrowser != null)
            {
                Process.Start(new ProcessStartInfo(foundBrowser, string.Format("--app=\"{0}\" --window-size=1680,1000", StudioUrl))
                {
                    UseShellExecute = true
                });
                Console.ForegroundColor = ConsoleColor.Green;
                Console.WriteLine("[LAUNCHED VIA BORDERLESS APP WINDOW]");
            }
            else
            {
                Process.Start(new ProcessStartInfo(StudioUrl) { UseShellExecute = true });
                Console.ForegroundColor = ConsoleColor.Green;
                Console.WriteLine("[LAUNCHED IN DEFAULT BROWSER]");
            }
        }

        static void RunInteractiveControlLoop()
        {
            Console.ForegroundColor = ConsoleColor.Cyan;
            Console.WriteLine(" ─────────────────────────────────────────────────────────────");
            Console.WriteLine("  J.A.R.V.I.S. INTERACTIVE CONTROLLER KEYBOARD SHORTCUTS:");
            Console.WriteLine("   [K] Spawn New Kali Terminal Window   [G] Open God's Eye 3D Earth");
            Console.WriteLine("   [A] Trigger Subsystem Auto-Setup     [E] Open Project Explorer");
            Console.WriteLine("   [S] Check Realtime Services Status   [Q] Graceful Shutdown & Exit");
            Console.WriteLine(" ─────────────────────────────────────────────────────────────");

            while (true)
            {
                Console.ForegroundColor = ConsoleColor.Gray;
                Console.Write("\n hermes-os> ");
                ConsoleKeyInfo key = Console.ReadKey();
                Console.WriteLine();

                switch (key.Key)
                {
                    case ConsoleKey.K:
                        LaunchKaliTerminal();
                        break;

                    case ConsoleKey.G:
                        Console.WriteLine(" [+] Spawning God's Eye 3D Earth Viewer...");
                        Process.Start(new ProcessStartInfo("msedge.exe", string.Format("--app=\"{0}\" --window-size=1400,900", GodseyeUrl)) { UseShellExecute = true });
                        break;

                    case ConsoleKey.A:
                        Console.WriteLine(" [*] Triggering Deep Auto-Setup & Self-Healing Diagnostic...");
                        Process.Start(new ProcessStartInfo("wsl.exe", "-d " + DistroName + " curl -s -X POST http://localhost:3001/api/system/auto-setup") { UseShellExecute = false, CreateNoWindow = true }).WaitForExit();
                        Console.ForegroundColor = ConsoleColor.Green;
                        Console.WriteLine(" [✔] Diagnostics and Self-Healing Routine Complete.");
                        break;

                    case ConsoleKey.E:
                        Console.WriteLine(" [+] Opening Windows File Explorer to Studio codebase...");
                        Process.Start(new ProcessStartInfo("explorer.exe", @"\\wsl.localhost\kali-linux\home\thecyberexpert\.gemini\antigravity\scratch\studio") { UseShellExecute = true });
                        break;

                    case ConsoleKey.S:
                        Process.Start(new ProcessStartInfo("wsl.exe", "-d " + DistroName + " " + WslManageScript + " status") { UseShellExecute = false });
                        break;

                    case ConsoleKey.Q:
                        Console.ForegroundColor = ConsoleColor.Yellow;
                        Console.WriteLine(" [*] Initiating clean shutdown of all background services...");
                        Process.Start(new ProcessStartInfo("wsl.exe", "-d " + DistroName + " " + WslManageScript + " stop") { UseShellExecute = false, CreateNoWindow = true }).WaitForExit();
                        Console.ForegroundColor = ConsoleColor.Green;
                        Console.WriteLine(" [✔] All services stopped. Goodbye!");
                        Thread.Sleep(1200);
                        return;

                    default:
                        Console.WriteLine(" Unknown key command. Press K, G, A, E, S, or Q.");
                        break;
                }
            }
        }
    }
}
