"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Download, FileText, Info, Copy, Check, ArrowLeft } from "lucide-react"
import { useState } from "react"
import { useRouter } from "next/navigation"

const SAMPLE_XML_FILE = `<?xml version="1.0" encoding="UTF-8"?>
<eu:AuthData xmlns:eu="http://financnasprava.sk/ekasa/udaje/schema/v2">
   <eu:KeyStoreType>PKCS12</eu:KeyStoreType>
   <eu:Data>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</eu:Data>
   <eu:CertificateAlias>88812345604850001</eu:CertificateAlias>
</eu:AuthData>`

const PASSWORD = "88812345604850001"

const downloadXmlFile = () => {
  const blob = new Blob([SAMPLE_XML_FILE], { type: "application/xml" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = "88812345604850001_platny_v2.0_20270903.xml"
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export default function DownloadPage() {
  const [copied, setCopied] = useState(false)
  const router = useRouter()

  const copyPassword = async () => {
    try {
      await navigator.clipboard.writeText(PASSWORD)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy password:", err)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-2xl">
          <Card className="shadow-lg border-0 bg-white/95 backdrop-blur-sm">
            <CardHeader className="text-center pb-6 px-4 sm:px-6">
              <CardTitle className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center justify-center gap-2">
                <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                Stiahnuť XML súbor s autentifikačnými údajmi
              </CardTitle>
              <p className="text-xs sm:text-sm text-gray-600 mt-2">
                XML súbor s autentifikačnými údajmi pre testovanie aplikácie
              </p>
            </CardHeader>
            <CardContent className="space-y-6 px-4 sm:px-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
                <div className="flex items-start gap-2 sm:gap-3">
                  <Info className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-blue-900 mb-2 text-sm sm:text-base">
                      XML súbor a heslo do testovacieho prostredia aplikácie
                    </h3>
                    <p className="text-xs sm:text-sm text-blue-800 mb-4 leading-relaxed">
                      Tento súbor obsahuje autentifikačné údaje vo formáte XML, ktoré môžete použiť na prihlásenia sa do
                      testovacieho prostredia aplikácie.
                    </p>

                    <div className="bg-white rounded border border-blue-200 p-2 sm:p-3 mb-4">
                      <div className="text-xs text-gray-600 mb-1">Názov súboru:</div>
                      <div className="font-mono text-xs sm:text-sm text-gray-900 break-all">
                        88812345604850001_platny_v2.0_20270903.xml
                      </div>
                    </div>

                    <Button
                      onClick={downloadXmlFile}
                      className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto text-sm"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Stiahnuť XML súbor
                    </Button>

                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-4">
                      <div className="text-xs sm:text-sm text-green-800 mb-2">
                        <strong>Heslo pre testovanie:</strong>
                      </div>
                      <div className="flex items-center gap-2 bg-white rounded border border-green-200 p-2">
                        <code className="font-mono text-xs sm:text-sm text-gray-900 flex-1 break-all">{PASSWORD}</code>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={copyPassword}
                          className="h-8 w-8 p-0 hover:bg-green-100 flex-shrink-0"
                        >
                          {copied ? (
                            <Check className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
                          ) : (
                            <Copy className="h-3 w-3 sm:h-4 sm:w-4 text-gray-600" />
                          )}
                        </Button>
                      </div>
                      {copied && <div className="text-xs text-green-600 mt-1">Heslo bolo skopírované!</div>}
                    </div>

                    <div className="text-center pt-4">
                      <Button
                        variant="outline"
                        onClick={() => router.push("/")}
                        className="text-gray-600 hover:text-gray-900 w-full sm:w-auto text-sm"
                      >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Späť na prihlásenie
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
