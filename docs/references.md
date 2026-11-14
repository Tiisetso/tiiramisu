# Evidence & references

Research behind Tiiramisu's design choices, gathered while building. Use these in the written submission and pitch. Each entry says **what we use it for** and any **caveat** so claims stay honest.

## Detecting relapse at home (smart sensing)

**1. Flattening day/night rest-activity rhythm preceded depressive relapse.**
McMaster University study in *JAMA Psychiatry*: 93 adults with previously recovered major depressive disorder wore a research-grade actigraphy device for up to two years; when the difference between daytime activity and night-time rest shrank, relapse often followed.
- Used for: the **"Day & night rhythm"** signal (relative amplitude of hourly steps), our strongest-weighted signal.
- Sources: [HealthDay summary](https://www.healthday.com/health-news/mental-health/smartwatches-may-soon-predict-a-depression-relapse) · [MD Psych Foundation summary](https://mdpsychfoundation.org/?p=25818)
- Caveat: we cite secondary coverage; quote the original JAMA Psychiatry paper in the final submission.

**2. Sleep efficiency and sleep-timing regularity track depression outcomes (RADAR-MDD).**
Multi-site cohort (~600 people with recurrent depression, London/Amsterdam/Barcelona) using wearables and phones; Fitbit analyses linked less efficient sleep and more variable sleep midpoints to worse outcomes.
- Used for: **"Sleep timing"** and **"Sleep quality"** signals.
- Sources: [RADAR-MDD protocol (BMC Psychiatry 2019)](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6379954/) · [RADAR-MDD recruitment/retention (UCL)](https://discovery.ucl.ac.uk/id/eprint/10173622/1/Dobson_Remote%20Assessment%20of%20Disease%20and%20Relapse%20in%20Major%20Depressive%20Disorder%20(RADAR-MDD)_VoR.pdf)

**3. Speech rate, articulation rate, loudness and pitch variability fall on worse days (within-person).**
Lewis et al., Interspeech 2025: 3,374 recordings from 71 patients with MDD over 12 weeks; daily drops in speaking/articulation rate and pitch variability tracked worse depression. Cummins et al. (cited therein): 585 participants, speaking rate and loudness negatively associated with severity. Wang et al. 2023: voice acoustic variation narrows as severity increases.
- Used for: on-device **voice features** compared with *your own usual voice*.
- Sources: [Lewis et al., Interspeech 2025](https://www.isca-archive.org/interspeech_2025/lewis25_interspeech.html) · [Wang et al., Frontiers in Psychiatry 2023](https://www.frontiersin.org/journals/psychiatry/articles/10.3389/fpsyt.2023.1195276/full) · [PMC10320390](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC10320390/)
- Caveat: Cummins et al. figures are reported secondhand via Lewis et al.

**4. Resting heart rate and HRV in depression.**
Treatment-resistant depression showed higher HR, lower RMSSD and flattened daily HR/RMSSD rhythms.
- Used for: the **"Body calm (HRV)"** signal (lower weight).
- Source: [PMC8358607](https://pmc.ncbi.nlm.nih.gov/articles/PMC8358607/)
- Caveat: evidence for HRV as a *relapse predictor* is weaker. Apple Health reports HRV as SDNN, not RMSSD.

**5. GPS mobility correlates with symptoms but may not predict them.**
Saeb et al. 2015: location variance, circadian movement and entropy correlated with PHQ-9 (r ≈ −0.58 to −0.63). A larger study (n = 1,013) found circadian movement related to concurrent but not future symptoms.
- Used for: deciding **not** to build GPS tracking (privacy cost, weak prediction).
- Sources: [Saeb et al., JMIR 2015](https://pmc.ncbi.nlm.nih.gov/articles/PMC4526997) · [Prospective study](https://pmc.ncbi.nlm.nih.gov/articles/PMC10955925)

**6. Wearables after rTMS to detect early relapse (WARN-D).**
Feasibility protocol using an Oura ring after rTMS treatment to detect early signs of relapse: the exact setting of this challenge.
- Used for: positioning (we complement this with voice, social and response-learning).
- Source: [JMIR Research Protocols 2026](https://www.researchprotocols.org/2026/1/e89466/authors)

## Responding & reinforcing (usefulness, ease of use)

**7. Behavioural activation delivered by app works, but engagement fades.**
Moodivate RCT (*JAMA Internal Medicine* 2025): 649 adults with ≥ moderate depression in primary care; BDI-II change ≈ −10.3 (app) vs −5.9 (usual care); remission more than twice as likely. Only ~33% still used the app at 12 weeks.
- Used for: the **response loop** (small activities + "did it help?"), and our focus on *gentle* engagement (no pressure mechanics).
- Sources: [Psychiatric News alert](https://alert.psychnews.org/2025/04/digital-behavioral-activation-app-shows.html) · [EurekAlert release](https://www.eurekalert.org/news-releases/1080039) · [Pilot RCT 2019](https://pmc.ncbi.nlm.nih.gov/articles/PMC6582985)
- Caveat: several authors co-own the company behind Moodivate.

**8. Depression blunts anticipated pleasure in daily life.**
Experience-sampling study of people with MDD found deficits in both anticipating and experiencing pleasure in everyday activities; a 2025 study reports blunted anticipatory pleasure in dysphoria.
- Used for: **"Predict, then notice"**: asking how much something might help *before*, then how it was *after*, and showing the gap.
- Sources: [Experience-sampling study (PMC5305427)](https://pmc.ncbi.nlm.nih.gov/articles/PMC5305427) · [Affective forecasting dynamics, 2025 (PMC12832834)](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12832834/)
- Caveat: whether people with depression systematically *under*-predict enjoyment is not settled; frame the feature as reflection, not correction.

**9. Gamification adds no benefit in depression apps.**
Meta-analysis (Six et al., *JMIR Mental Health* 2021, 50 comparisons): apps with gamification were no better for symptoms or adherence than apps without.
- Used for: **no streaks, points, badges or counts**; reinforcement comes from a warm, responsive environment instead (light field blooms, afterglow).
- Sources: [Six et al. 2021](https://mental.jmir.org/2021/11/e32199)
- Caveat: claims that streaks cause *guilt* are design opinion, not yet studied ([ustwo essay](https://ustwo.com/blog/time-to-dispel-the-habit-myth-wellness-apps-are-not-helping-you-but-hacking-you/)).

## Safety

**10. Crisis support in Finland.**
112 for emergencies; MIELI Crisis Helpline 09 2525 0111 (Finnish, 24/7). MIELI's English-language phone line closed in 2026; English support is via MIELI's online chat.
- Used for: the **crisis sheet**.
- Sources: [Nyyti: important numbers](https://www.nyyti.fi/?p=17859) · [Report on English line closure (2026)](https://news.spill.org/en/article/mieli-closes-english-language-crisis-phone-line-switches-to-online-support-312)
- Caveat: verify current numbers with the organisers before presenting.

## Platform & privacy facts (partner prizes)

- **Aiven for PostgreSQL**, DigitalOcean Frankfurt (EU), TLS verified against Aiven's CA; no raw audio stored.
- **CRACI**: builds and the synthetic patient run with deny-by-default networking; the privacy guard reads CRACI's CycloneDX SBOMs and network traces via the [CRACI API](https://api.craci.com/openapi.json). Verified run: 396 components, 0 trackers; voice → api.elevenlabs.io (~258 KB), transcript → api.anthropic.com (~18 KB).
- **ElevenLabs**: Speech-to-Text (Scribe), Sound Effects (ambient loops), voice for the demo video.
- **Claude** (`claude-opus-5-5`): check-in analysis with structured output; clinician summaries.
