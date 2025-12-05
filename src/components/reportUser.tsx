import React, { useState } from 'react'
import { X } from 'lucide-react'
import { toast } from 'react-toastify'
import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase/firebase'

interface ReportUserButtonProps {
  reportedName: string
  reportedUID?: string
  listingId?: string
  reporterName?: string
}

const criteriaOptions = [
  'Spam / Scam',
  'Harassment / Abuse',
  'Misleading Listing',
  'Illegal Item',
  'Other'
]

export default function ReportUserButton({reportedName, reportedUID, listingId, reporterName}: ReportUserButtonProps){
  const [open, setOpen] = useState(false)
  const [selectedCriteria, setSelectedCriteria] = useState<string[]>([])
  const [details, setDetails] = useState('')
  const [reportSaved, setReportSaved] = useState(false)
  const [mailtoLink, setMailtoLink] = useState('')

  const toggleCriteria = (option: string) => {
    setSelectedCriteria(prev => prev.includes(option) ? prev.filter(x => x !== option) : [...prev, option])
  }

  const handleSubmit = async () => {
    if (selectedCriteria.length === 0 && details.trim() === '') {
      toast.warn('Please select at least one reason or provide details.', {toastId: 'report-empty'})
      return
    }

    const subject = `Report user: ${reportedName}`
    const bodyLines = [
      `Reporter: ${reporterName || 'Anonymous'}`,
      `Reported user: ${reportedName} ${reportedUID ? `(${reportedUID})` : ''}`,
      `Listing: ${listingId || 'N/A'}`,
      `Reasons: ${selectedCriteria.length ? selectedCriteria.join(', ') : 'N/A'}`,
      '',
      'Details:',
      details || 'No additional details provided.'
    ]
    const body = bodyLines.join('\n')
    const mailto = `mailto:TigerTradingLSU@outlook.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`

    // Persist report to Firestore as a reliable fallback for admins
    try {
      await addDoc(collection(db, 'Reports'), {
        reporterName: reporterName || null,
        reportedName: reportedName || null,
        reportedUID: reportedUID || null,
        listingId: listingId || null,
        reasons: selectedCriteria,
        details: details || null,
        createdAt: serverTimestamp(),
      })
      toast.success('Report saved. Support will be able to review it.', {toastId: 'report-saved'})
    } catch (err) {
      console.error('Error saving report to Firestore:', err)
      toast.error('Failed to save report locally. You can still send it manually.', {toastId: 'report-save-fail'})
    }
    // Prepare a mailto link and show it to the user (do NOT automatically open the mail client)
    setMailtoLink(mailto)
    setReportSaved(true)
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="px-3 py-1 text-sm font-semibold bg-[#FDD023] text-black rounded-2xl hover:bg-[#f2b200] transition"
      >
        Report
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4">
          <div className="max-w-xl w-full rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-[#2c1844] text-white">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-[#41206a]">
              <h3 className="text-lg font-semibold text-[#FDD023]">Report user to TigerTradingLSU@outlook.com</h3>
              <button onClick={() => setOpen(false)} className="p-2 text-white/70 hover:text-white"><X /></button>
            </div>

            <div className="p-5 space-y-4">
              {!reportSaved ? (
                <>
                  <p className="text-sm text-white/80">Select one or more reasons below and provide any additional details that will help our support team investigate.</p>

                  <div className="grid grid-cols-2 gap-3">
                    {criteriaOptions.map(opt => (
                      <label key={opt} className="flex items-center gap-3 px-3 py-2 rounded bg-[#1a0f2e]">
                        <input
                          type="checkbox"
                          checked={selectedCriteria.includes(opt)}
                          onChange={() => toggleCriteria(opt)}
                          className="accent-[#FDD023] w-4 h-4"
                        />
                        <span className="text-sm text-white">{opt}</span>
                      </label>
                    ))}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">Details (optional)</label>
                    <textarea
                      value={details}
                      onChange={(e) => setDetails(e.target.value)}
                      rows={5}
                      className="w-full bg-[#1a0f2e] text-white border border-white/10 rounded p-3 focus:outline-none focus:ring-2 focus:ring-[#FDD023]"
                      placeholder="Provide context, links, or any other helpful information."
                    />
                  </div>

                  <div className="flex justify-end gap-3">
                    <button onClick={() => setOpen(false)} className="px-4 py-2 bg-white/5 text-white rounded-lg">Cancel</button>
                    <button onClick={handleSubmit} className="px-4 py-2 bg-[#FDD023] text-black rounded-lg font-semibold">Send Report</button>
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-white/80">If you would like to provide further information, please email</p>
                  <div className="bg-[#1a0f2e] p-3 rounded border border-white/10">
                    <a href={mailtoLink} className="text-[#FDD023] underline break-words">TigerTradingLSU@outlook.com</a>
                  </div>
                  <div className="flex justify-end">
                    <button onClick={() => { setOpen(false); setReportSaved(false); setSelectedCriteria([]); setDetails(''); }} className="px-4 py-2 bg-white/5 text-white rounded-lg">Close</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
