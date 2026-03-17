'use client';

import { useEffect, useMemo, useState } from 'react';
import Cite from 'citation-js';
import Image from 'next/image';
import loaderGif from '@/public/images/arche_logo_flip_47px.gif';
import { PUBLIC_CONFIG } from '@/config/public';
import { useTranslation } from 'react-i18next';

type Props = {
  /** URL that returns CSL-JSON (your example works out of the box) */
  src?: string;
  /** Default language for CSL (affects things like “and” vs “et al.”) */
  lang?: string; // e.g., 'en-US'
};

type FormatKey =
  | 'APA_6TH'
  | 'ARCHE_CITE'
  | 'HARVARD'
  | 'VANCOUVER'
  | 'JSON_CSL'
  | 'BIBLATEX';

const STYLE_URLS: Record<'APA_6TH' | 'HARVARD' | 'VANCOUVER', string> = {
  APA_6TH:
    'https://raw.githubusercontent.com/citation-style-language/styles/master/apa-6th-edition.csl',
  HARVARD:
    'https://raw.githubusercontent.com/citation-style-language/styles/master/harvard-cite-them-right.csl',
  VANCOUVER:
    'https://raw.githubusercontent.com/citation-style-language/styles/master/vancouver.csl',
};

export default function CiteBlock({ resourceID, lang = 'en-US' }: Props) {
  const { t } = useTranslation();

  const [cslJson, setCslJson] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [stylesLoaded, setStylesLoaded] = useState(false);
  const [format, setFormat] = useState<FormatKey>('APA_6TH');
  const [output, setOutput] = useState('');
  const [copyOk, setCopyOk] = useState(false);

  const [archeText, setArcheText] = useState<string>('');
  const [loadingArche, setLoadingArche] = useState<boolean>(true);
  const [archeErr, setArcheErr] = useState<string | null>(null);

  const src = `${process.env.NEXT_PUBLIC_BIBLATEX_URL}/?id=${PUBLIC_CONFIG.apiBase}/${resourceID}&lang=en&format=application%2Fvnd.citationstyles.csl%2Bjson`;
  const arche_cite_src = `${process.env.NEXT_PUBLIC_BIBLATEX_URL}/?id=${PUBLIC_CONFIG.apiBase}/${resourceID}&lang=en&format=arche-citation-style`;

  // 1) Load CSL-JSON
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setErr(null);
        const res = await fetch(src, { cache: 'no-store' });

        if (!res.ok) {
          console.log(`Failed to load CSL-JSON (HTTP ${res.status})`);
          throw new Error(`Failed to load CSL-JSON (HTTP ${res.status})`);
        }

        const json = await res.json();
        if (!cancelled) setCslJson(json);
      } catch (e: any) {
        if (!cancelled) setErr(e?.message ?? 'Unknown error');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [src]);

  // 1b) Load ARCHE_CITE text (plain text)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoadingArche(true);
        setArcheErr(null);
        const res = await fetch(arche_cite_src, {
          cache: 'no-store',
          headers: { Accept: 'text/plain,*/*' },
        });
        if (!res.ok)
          throw new Error(`Failed to load ARCHE citation (HTTP ${res.status})`);
        const txt = await res.text();
        if (!cancelled) setArcheText(txt.trim());
      } catch (e: any) {
        if (!cancelled) {
          setArcheErr(e?.message ?? 'Unknown error');
          setArcheText('');
        }
      } finally {
        if (!cancelled) setLoadingArche(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [arche_cite_src]);

  // 2) Fetch styles and REGISTER them with names
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const entries = await Promise.all(
          (Object.keys(STYLE_URLS) as Array<keyof typeof STYLE_URLS>).map(
            async (k) => {
              const r = await fetch(STYLE_URLS[k]);
              if (!r.ok) throw new Error(`Style ${k} HTTP ${r.status}`);
              const xml = await r.text();
              // Register with a stable name
              const name =
                k === 'APA_6TH'
                  ? 'apa-6th-edition'
                  : k === 'HARVARD'
                    ? 'harvard-cite-them-right'
                    : 'vancouver';
              // IMPORTANT: register once
              if (!Cite.CSL.register.getTemplate(name)) {
                Cite.CSL.register.addTemplate(name, xml);
              }

              return name;
            }
          )
        );
        if (!cancelled) setStylesLoaded(true);
      } catch (e) {
        // Styles missing? We’ll still allow JSON-CSL/BibLaTeX
        if (!cancelled) setStylesLoaded(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // 3) Render on changes
  useEffect(() => {
    (async () => {
      try {
        setOutput('');
        setCopyOk(false);
        if (!cslJson) return;

        const cite = new Cite(cslJson);

        if (format === 'JSON_CSL') {
          setOutput(JSON.stringify(cslJson, null, 2));
          return;
        }

        if (format === 'BIBLATEX') {
          setOutput(cite.format('bibtex').trim());
          return;
        }

        if (format === 'ARCHE_CITE') {
          setOutput(
            archeText ||
              (loadingArche ? '// Loading ARCHE citation…' : '// No output')
          );
          return;
        }

        if (!stylesLoaded) {
          setOutput('// Loading styles…');
          return;
        }

        // Use the REGISTERED template name here:
        const templateName =
          format === 'APA_6TH'
            ? 'apa-6th-edition'
            : format === 'HARVARD'
              ? 'harvard-cite-them-right'
              : 'vancouver';

        const formatted = cite.format('bibliography', {
          format: 'text', // or 'html'
          template: templateName, // <-- name, not XML
          lang,
        });

        const out = Array.isArray(formatted)
          ? formatted.join('\n')
          : (formatted as string);
        setOutput(out.trim());
      } catch (e: any) {
        setOutput(`// Failed to format citation: ${e?.message ?? e}`);
      }
    })();
  }, [cslJson, stylesLoaded, format, lang]);

  const options = useMemo(
    () => [
      { key: 'APA_6TH' as const, label: 'APA 6th' },
      { key: 'HARVARD' as const, label: 'Harvard (Cite Them Right)' },
      { key: 'VANCOUVER' as const, label: 'Vancouver' },
      { key: 'JSON_CSL' as const, label: 'JSON-CSL' },
      { key: 'BIBLATEX' as const, label: 'BibLaTeX' },
      { key: 'ARCHE_CITE' as const, label: 'ARCHE Citation' },
    ],
    []
  );

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(output);
      setCopyOk(true);
      setTimeout(() => setCopyOk(false), 1200);
    } catch {
      setCopyOk(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-gray-600">
        <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-transparent" />
        <div className="flex justify-center items-center p-8">
          <Image
            src={loaderGif}
            alt="Loading...."
            width={64}
            height={64}
            className="w-16 h-16"
          />
        </div>
      </div>
    );
  }

  if (err) {
    return <div className="hidden"></div>;
  }

  return (
    <div className="w-full space-y-3 pt-6">
      <h5>{t('Cite Resource')}</h5>
      <div className="flex flex-col items-start gap-6 self-stretch rounded-[12px] bg-[#EEF5F8] p-6">
        <div className="whitespace-pre-wrap">{output || '// No output'}</div>

        <div className="w-full flex justify-end">
          {!stylesLoaded &&
            (format === 'APA_6TH' ||
              format === 'HARVARD' ||
              format === 'VANCOUVER') && (
              <div className="flex justify-center items-center p-8">
                <Image
                  src={loaderGif}
                  alt="Loading...."
                  width={64}
                  height={64}
                  className="w-16 h-16"
                />
              </div>
            )}

          <select
            id="fmt"
            value={format}
            onChange={(e) => setFormat(e.target.value as FormatKey)}
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-gray-500 focus:outline-none"
          >
            {options.map((o) => (
              <option key={o.key} value={o.key}>
                {o.label}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={handleCopy}
            disabled={!output}
            className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium shadow-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {copyOk ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>
    </div>
  );
}
