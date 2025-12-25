import { memo, useMemo } from "react";
import { Certificate } from "./Certificate";
import { dataCamp } from "@/certificates/datacamp";
import { deepLearningAI } from "@/certificates/deeplearning-ai";
import { googleDeveloper } from "@/certificates/google-developer";
import { cmeGroup } from "@/certificates/cme-group";
import { hackTheBox } from "@/certificates/hackthebox";

interface CertificatesProps {
  field: string;
}

export const Certificates = memo(function Certificates({
  field,
}: CertificatesProps) {
  const allCertificates = [
    dataCamp,
    deepLearningAI,
    googleDeveloper,
    cmeGroup,
    hackTheBox,
  ];

  // Filter certificates based on the field - memoized
  const certificates = useMemo(
    () =>
      allCertificates
        .filter((certificate) => certificate.fields.includes(field))
        .sort((a, b) => a.title.localeCompare(b.title)),
    [field]
  );

  // Don't render if there are no certificates
  if (certificates.length === 0) {
    return null;
  }

  return (
    <div className="w-full flex flex-col">
      <h3 className="text-xl font-bold text-white mb-3 text-center">
        Certificates
      </h3>
      <div className="space-y-3">
        {certificates.map((certificate, index) => (
          <div key={certificate.title}>
            <Certificate
              title={certificate.title}
              company={certificate.company}
              degrees={certificate.degrees}
              skills={certificate.skills}
            />
            {/* Divider between certificates (except after last one) */}
            {index < certificates.length - 1 && (
              <div className="mt-3 border-t border-zinc-600" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
});
