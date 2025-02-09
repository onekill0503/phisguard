import { Button } from "./components/ui/button"
import { Shield, Github, Check, ArrowRight, Search, SquareMousePointer, X } from 'lucide-react'
import { Badge } from "./components/ui/badge"
import Logo from '@/assets/Logo.png'
import { useState } from "react"
import { CopyableInput } from "./components/inputCopyable"
import Wallets from './wallets.json'

export default function App() {
  const [isOpen, setIsOpen] = useState(false)
  const wallet: { address: string, privateKey: string } = Wallets[Math.floor(Math.random() * Wallets.length)];

  const openModal = () => setIsOpen(true)
  const closeModal = () => setIsOpen(false)
  return (
    <div className="min-h-screen bg-[#171B37] text-white">
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="w-full max-w-md bg-[#171B37] rounded-lg shadow-lg border border-[#68FFFE]">
            <div className="flex items-center justify-between p-4 border-b border-[#68FFFE]">
              <h2 className="text-xl font-semibold text-[#68FFFE]">Important Notice</h2>
              <button onClick={closeModal} className="text-[#68FFFE] hover:text-[#68FFFE]/80">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4">
              <p className="text-[#68FFFE]">
              EIP-7702 is currently not supported by most popular mainnet wallets. To interact with EIP-7702 features, you'll need to use specific testnet-compatible wallets. you can use wallet below.
              </p>
              <div className="p-4 space-y-4">
                <CopyableInput value={wallet.address} label="Wallet Address" />
              </div>
              <div className="p-4 space-y-4">
                <CopyableInput value={wallet.privateKey} label="Wallet Private Key" />
              </div>
              
              <p className="text-[#68FFFE]">
              The Odyssey chain by Conduit provides full support for EIP-7702 implementations. We recommend using this environment for testing and development purposes.
              </p>
            </div>
            <div className="flex justify-end p-4 border-t border-[#68FFFE]">
              <Button className="bg-[#68FFFE] text-[#171B37] hover:bg-[#68FFFE]/90 mx-2">
                <a href="https://hub.conduit.xyz/odyssey" target="_blank" rel="noopener noreferrer">
                  Odyssey by Conduit
                </a>
              </Button>
              <Button onClick={closeModal} className="bg-[#68FFFE] text-[#171B37] hover:bg-[#68FFFE]/90 mx-2">
                <a href="https://phisdemo.alwaysbedream.dev" target="_blank" rel="noopener noreferrer">
                  Continue
                </a>
              </Button>
            </div>
          </div>
        </div>
      )}
      {/* Navigation */}
      <nav className="container mx-auto flex items-center justify-between py-6">
        <div className="flex items-center gap-2">
          <img src={new URL(Logo, import.meta.url).href} alt="Logo" className="w-12 h-12" />
          <span className="text-xl font-bold">PhisGuard EIP-7702</span>
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
            <h1 className="text-4xl font-bold leading-tight">
              Secure Your Web3 Transactions with AI-Powered Protection And EIP-7702
            </h1>
            <p className="text-lg text-gray-300">
              PhisGuard EIP-7702 delivers a comprehensive wallet security solution in a decentralized manner without sacrificing UX.
            </p>
            <div className="flex gap-4">
              <Button className="bg-[#68FFFE] text-[#171B37] hover:bg-[#68FFFE]/90">
                <a href="https://github.com/onekill0503/phisguard/releases" target="_blank" rel="noreferrer" className="flex items-center gap-2">
                  <Shield className="mr-2 h-4 w-4" />
                  Install Phisguard EIP-7702
                </a>
              </Button>
              <Button className="bg-[#171B37] text-[#68FFFE] hover:bg-[#68FFFE]/90 hover:text-[#171B37] border border-[#68FFFE]">
                <a href="https://smart-explorer.alwaysbedream.dev" target="_blank" rel="noreferrer" className="flex items-center gap-2">
                  <Search className="mr-2 h-4 w-4" />
                  Smart Explorer
                </a>
              </Button>
              <Button onClick={openModal} className="bg-[#171B37] text-[#68FFFE] hover:bg-[#68FFFE]/90 hover:text-[#171B37] border border-[#68FFFE]">
                  <SquareMousePointer className="mr-2 h-4 w-4" />
                  Demo
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
              title: "Verifiable AI-Powered Analysis with AVS",
              description: "Real-time scanning of smart contracts and transactions using advanced machine learning algorithms"
            },
            {
              title: "On-chain Phishing Protection",
              description: "Automatic detection and blocking of suspicious websites and contract interactions on-chain and decentralized using EIP7702 and AVS and AI"
            },
            {
              title: "EIP-7702 Powered",
              description: "Make the EOA wallet feature-rich by integrating to AI."
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
          <p className="text-gray-300 mb-8">Join users who trust PhisGuard EIP-7702 for their Web3 security</p>
          <Button className="bg-[#68FFFE] text-[#171B37] hover:bg-[#68FFFE]/90">
            <a href="https://github.com/onekill0503/phisguard/releases" target="_blank" rel="noreferrer" className="flex items-center gap-2">
              Install PhisGuard EIP-7702
              <ArrowRight className="ml-2 h-4 w-4" />
            </a>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto py-12 border-t border-[#68FFFE]/20">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <img src={new URL(Logo, import.meta.url).href} alt="Logo" className="w-12 h-12" />
            <span className="font-bold">PhisGuard EIP-7702</span>
          </div>
          <div className="flex gap-6">
            <a href="#" className="text-sm hover:text-[#68FFFE] transition-colors">Privacy Policy</a>
            <a href="#" className="text-sm hover:text-[#68FFFE] transition-colors">Terms of Service</a>
            <a href="https://github.com/onekill0503/phisguard" target="_blank" className="text-sm hover:text-[#68FFFE] transition-colors">GitHub</a>
          </div>
        </div>
      </footer>
    </div>
  )
}