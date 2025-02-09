import { Button } from "./components/ui/button"
import { Shield, Chrome, Github, Check, ArrowRight, Search } from 'lucide-react'
import { Badge } from "./components/ui/badge"
import Logo from '@/assets/Logo.png'

export default function App() {
  return (
    <div className="min-h-screen bg-[#171B37] text-white">
      {/* Navigation */}
      <nav className="container mx-auto flex items-center justify-between py-6">
        <div className="flex items-center gap-2">
          <img src={new URL(Logo, import.meta.url).href} alt="Logo" className="w-12 h-12" />
          <span className="text-xl font-bold">PhisGuard</span>
        </div>
        <div className="flex gap-6">
          <a href="#" className="hover:text-[#68FFFE] transition-colors">Documentation</a>
          <a href="#" className="hover:text-[#68FFFE] transition-colors">Support</a>
          <a href="#" className="hover:text-[#68FFFE] transition-colors">Contact</a>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto py-24">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h1 className="text-5xl font-bold leading-tight">
              Secure Your Web3 Transactions with AI-Powered Protection
            </h1>
            <p className="text-lg text-gray-300">
              PhisGuard uses advanced AI to detect and prevent phishing attempts in real-time, 
              keeping your crypto assets safe from scams.
            </p>
            <div className="flex gap-4">
              <Button className="bg-[#68FFFE] text-[#171B37] hover:bg-[#68FFFE]/90">
                <a href="https://github.com/onekill0503/phisguard/releases" target="_blank" rel="noreferrer" className="flex items-center gap-2">
                  <Shield className="mr-2 h-4 w-4" />
                  Install Phisguard
                </a>
              </Button>
              <Button className="bg-[#171B37] text-[#68FFFE] hover:bg-[#68FFFE]/90 hover:text-[#171B37] border border-[#68FFFE]">
                <a href="https://smart-explorer.alwaysbedream.dev" target="_blank" rel="noreferrer" className="flex items-center gap-2">
                  <Search className="mr-2 h-4 w-4" />
                  Smart Explorer
                </a>
              </Button>
            </div>
            <div className="flex items-center gap-6 pt-4">
              <div className="flex items-center gap-2">
                <Github className="h-5 w-5 text-[#68FFFE]" />
                <span>Open Source</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-[#68FFFE]" />
                <span>AI-Powered Security</span>
              </div>
            </div>
          </div>
          <div className="relative">
            <div className="bg-gradient-to-r from-[#171B37] to-[#68FFFE]/20 rounded-lg p-8">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="bg-[#68FFFE]/10 text-[#68FFFE]">
                    Security Alert
                  </Badge>
                  <span className="text-[#68FFFE]">Live Protection</span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-400" />
                    <span>Smart Contract Analysis</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-400" />
                    <span>Phishing Detection</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-400" />
                    <span>Transaction Verification</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-4">Advanced Security Features</h2>
          <p className="text-gray-300">Protecting your assets with cutting-edge AI technology</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              title: "AI-Powered Analysis",
              description: "Real-time scanning of smart contracts and transactions using advanced machine learning algorithms"
            },
            {
              title: "Phishing Protection",
              description: "Automatic detection and blocking of suspicious websites and contract interactions"
            },
            {
              title: "Transaction Guard",
              description: "Detailed analysis of each transaction to prevent unauthorized fund transfers"
            }
          ].map((feature) => (
            <div key={feature.title} className="p-6 rounded-lg bg-[#171B37] border border-[#68FFFE]/20 hover:border-[#68FFFE] transition-colors">
              <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
              <p className="text-gray-300">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto py-24">
        <div className="bg-gradient-to-r from-[#171B37] to-[#68FFFE]/20 rounded-lg p-12 text-center">
          <h2 className="text-3xl font-bold mb-4">Start Protecting Your Assets Today</h2>
          <p className="text-gray-300 mb-8">Join thousands of users who trust PhisGuard for their Web3 security</p>
          <Button className="bg-[#68FFFE] text-[#171B37] hover:bg-[#68FFFE]/90">
            <a href="https://github.com/onekill0503/phisguard/releases" target="_blank" rel="noreferrer" className="flex items-center gap-2">
              Install PhisGuard
              <ArrowRight className="ml-2 h-4 w-4" />
            </a>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto py-12 border-t border-[#68FFFE]/20">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-[#68FFFE]" />
            <span className="font-bold">PhisGuard</span>
          </div>
          <div className="flex gap-6">
            <a href="#" className="text-sm hover:text-[#68FFFE] transition-colors">Privacy Policy</a>
            <a href="#" className="text-sm hover:text-[#68FFFE] transition-colors">Terms of Service</a>
            <a href="#" className="text-sm hover:text-[#68FFFE] transition-colors">GitHub</a>
          </div>
        </div>
      </footer>
    </div>
  )
}