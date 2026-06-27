import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { Building2, MapPin } from 'lucide-react';
import type { DailyTask } from '../store/useStore';
import { findCountry, type Country } from '../lib/countries';
import { taskCountryCode } from '../lib/progress';
import { fadeSlideUp, motionTransition, useReducedMotion } from '../lib/motion';

interface CountryLearnCardProps {
  task: DailyTask;
}

export function resolveCountryForTask(task: DailyTask): Country | undefined {
  const code = taskCountryCode(task);
  return code ? findCountry(code) : undefined;
}

export function CountryLearnCard({ task }: CountryLearnCardProps) {
  const country = resolveCountryForTask(task);
  const reduced = useReducedMotion();

  if (!country) return null;

  return (
    <motion.div
      initial={fadeSlideUp.initial}
      animate={fadeSlideUp.animate}
      transition={motionTransition(reduced, 0.3)}
      className="bg-surface-container-low border border-outline-variant/20 rounded-2xl p-4 flex gap-4 items-start"
    >
      <img
        src={`https://flagcdn.com/w160/${country.code.toLowerCase()}.png`}
        alt={`Flag of ${country.name}`}
        className="w-20 h-14 object-contain rounded-lg border border-outline-variant/20 shrink-0 shadow-sm"
        referrerPolicy="no-referrer"
      />
      <div className="min-w-0 flex-1 text-left">
        <p className="font-headline font-bold text-lg text-on-surface leading-tight">{country.name}</p>
        <p className="flex items-center gap-2 text-on-surface-variant mt-1.5 font-medium">
          <Building2 className="w-4 h-4 shrink-0" />
          <span>Capital: {country.capital}</span>
        </p>
        <Link
          to={`/atlas?country=${country.code}`}
          className="inline-flex items-center gap-1.5 text-primary text-sm font-bold mt-2 hover:underline"
        >
          <MapPin className="w-3.5 h-3.5" />
          Explore in Atlas
        </Link>
      </div>
    </motion.div>
  );
}
