export type GinMembershipLevel = {
  level: number;
  title: string;
  qualifications: string;
  benefits: string;
  cashBonuses: string;
  image: string;
  alt: string;
};

export const ginMembershipLevels: GinMembershipLevel[] = [
  { level: 1, title: "Level 1 Member", qualifications: "Initiation Fee $1,500; Monthly Dues $150", benefits: "Access to Level I Membership sections of the GIN website; access to all GIN events (with ticket purchase)", cashBonuses: "CLASSIFIED", image: "level-I-pin.jpg", alt: "Membership Level 1" },
  { level: 2, title: "Level 2 Member", qualifications: "CLASSIFIED", benefits: "CLASSIFIED", cashBonuses: "CLASSIFIED", image: "level-II-pin.jpg", alt: "Membership Level 2" },
  { level: 3, title: "Level 3 Member", qualifications: "CLASSIFIED", benefits: "CLASSIFIED", cashBonuses: "CLASSIFIED", image: "pin-level-III.jpg", alt: "Membership Level 3" },
  { level: 4, title: "Level 4 Member", qualifications: "CLASSIFIED", benefits: "CLASSIFIED", cashBonuses: "CLASSIFIED", image: "pin-level-IV.jpg", alt: "Membership Level 4" },
  { level: 5, title: "Level 5 Member", qualifications: "CLASSIFIED", benefits: "CLASSIFIED", cashBonuses: "CLASSIFIED", image: "pin-level-V.jpg", alt: "Membership Level 5" },
  { level: 6, title: "Level 6 / Executive Member", qualifications: "CLASSIFIED", benefits: "CLASSIFIED", cashBonuses: "CLASSIFIED", image: "pin-level-VI.jpg", alt: "Executive Member" },
  { level: 7, title: "Level 7 / Senior Officer", qualifications: "CLASSIFIED", benefits: "CLASSIFIED", cashBonuses: "CLASSIFIED", image: "pin-level-VII.jpg", alt: "Senior Officer" },
  { level: 8, title: "Level 8 / Director", qualifications: "CLASSIFIED", benefits: "CLASSIFIED", cashBonuses: "CLASSIFIED", image: "pin-level-VIII.jpg", alt: "Director" },
  { level: 9, title: "Level 9 / Presidents Club", qualifications: "CLASSIFIED", benefits: "CLASSIFIED", cashBonuses: "CLASSIFIED", image: "pin-level-IX.jpg", alt: "Presidents Club" },
  { level: 10, title: "Level 10 / Chairman’s Club", qualifications: "CLASSIFIED", benefits: "CLASSIFIED", cashBonuses: "CLASSIFIED", image: "pin-level-X.jpg", alt: "Chairmans Club" },
  { level: 11, title: "Level 11 / Inner Circle", qualifications: "CLASSIFIED", benefits: "CLASSIFIED", cashBonuses: "CLASSIFIED", image: "pin-level-XI.jpg", alt: "Level 11 Inner Circle membership pin" },
  { level: 12, title: "Level 12 / Partner", qualifications: "CLASSIFIED", benefits: "CLASSIFIED", cashBonuses: "CLASSIFIED", image: "pin-level-XII.jpg", alt: "Partner" },
];
