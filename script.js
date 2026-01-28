document.addEventListener('DOMContentLoaded', () => {
    // Accordion Logic
    const accordionItems = document.querySelectorAll('.accordion-item');

    accordionItems.forEach(item => {
        const header = item.querySelector('.accordion-header');
        header.addEventListener('click', () => {
            const isActive = item.classList.contains('active');

            // Close all items
            accordionItems.forEach(i => {
                i.classList.remove('active');
                i.querySelector('.accordion-content').style.maxHeight = null;
            });

            // Toggle clicked item
            if (!isActive) {
                item.classList.add('active');
                const content = item.querySelector('.accordion-content');
                content.style.maxHeight = content.scrollHeight + "px";
            }
        });
    });

    // Advanced Scroll & Feature Logic (Sequential Reveal / Progressive Disclosure)
    const featuresSection = document.querySelector('.sticky-feature-scroll');
    const featureCards = document.querySelectorAll('.feature-card');
    const featureImages = document.querySelectorAll('.image-stack img');

    // Config for progressive disclosure
    const BUFFER = 0.1; // 10% entry/exit buffer (hidden state)

    const updateFeatures = () => {
        if (!featuresSection) return;
        const rect = featuresSection.getBoundingClientRect();
        const sectionHeight = rect.height;
        const viewHeight = window.innerHeight;

        const overviewHeading = document.querySelector('.overview-heading');

        // Calculate total scroll progress (0 to 1)
        const totalScrollable = sectionHeight - viewHeight;
        const rawProgress = Math.min(totalScrollable, Math.max(0, -rect.top)) / totalScrollable;

        // Heading Fade Logic
        // We now treat the Heading as "Stage 0" and the First Feature as "Stage 1" transition
        // The Heading should be fully visible initially (Scroll 0)
        // And fade out EXACTLY as the first feature fades in.

        const featureUnits = document.querySelectorAll('.feature-unit');
        const numItems = featureUnits.length;

        // Define active range for features
        // We start slightly earlier so the swap happens immediately upon scrolling
        const ANIMATION_START = 0.0;
        const ANIMATION_END = 0.95;
        const scrollRange = ANIMATION_END - ANIMATION_START;

        // Normalized progress
        let progress = 0;
        if (rawProgress > ANIMATION_START) {
            progress = Math.min(1, (rawProgress - ANIMATION_START) / scrollRange);
        }

        // We pretend the Heading is index -1 => 0 transition
        // But simpler: We map progress 0..1 to indices 0..numItems
        // Actually, let's keep the existing logic but map the Heading to match the first item's entry.

        // Let's use a continuous "Stage" float
        // Stage 0.0 = Heading Visible, Feature 0 Hidden
        // Stage 1.0 = Heading Hidden, Feature 0 Fully Visible (Center)
        // Stage 2.0 = Feature 0 Hidden, Feature 1 Fully Visible
        // etc.

        const totalStages = numItems; // We want to end at the last feature
        const currentStage = progress * totalStages;

        const index = Math.floor(currentStage);
        const nextIndex = Math.min(index + 1, totalStages); // Can go up to equal numItems? No.
        const stageProgress = currentStage % 1; // 0.0 to 1.0 within the stage

        // --- HEADING LOGIC (Stage 0 -> 0.5) ---
        if (overviewHeading) {
            // Heading fades out earlier (0.0 to 0.5) to create more gap before features appear
            if (currentStage < 0.5) {
                // Heading Exits
                // Opacity 1 -> 0
                // Slide Up: 0px -> -100px
                const headingProgress = currentStage / 0.5; // Normalize to 0-1
                overviewHeading.style.opacity = 1 - headingProgress;
                overviewHeading.style.transform = `translateY(${-headingProgress * 100}px)`;
                overviewHeading.style.visibility = 'visible';
            } else {
                // Completely gone after Stage 0.5
                overviewHeading.style.opacity = 0;
                overviewHeading.style.visibility = 'hidden';
            }
        }


        // --- FEATURE LOGIC ---
        featureUnits.forEach((unit, i) => {
            // Each feature gets a full stage (1.0 unit of progress)
            // We divide each stage into phases with buffer zones to prevent overlap:
            // Phase 1: Entry (0.0 - 0.35) - Feature fades in
            // Phase 2: Active (0.35 - 0.65) - Feature is fully visible
            // Phase 3: Exit (0.65 - 1.0) - Feature fades out
            // Buffer: Gap before next feature starts

            // Adjusted: Feature 0 at stage 0.5-1.5, Feature 1 at 1.5-2.5, Feature 2 at 2.5-3.5
            const featureStageStart = i * 1.0 + 0.5; // Feature 0 starts at 0.5, Feature 1 at 1.5, Feature 2 at 2.5
            const featureStageEnd = featureStageStart + 1.0;   // Each feature has 1.0 stage duration

            // Calculate position within this feature's stage
            const relativeStage = currentStage - featureStageStart;

            // Reset defaults
            unit.style.opacity = 0;
            unit.style.visibility = 'hidden';
            unit.style.transform = 'translateY(100px)';
            unit.style.zIndex = 0;

            // Only show if we're in this feature's stage range
            if (currentStage >= featureStageStart && currentStage < featureStageEnd) {
                const ENTRY_END = 0.35;
                const ACTIVE_START = 0.35;
                const ACTIVE_END = 0.65;
                const EXIT_START = 0.65;

                if (relativeStage < ENTRY_END) {
                    // ENTERING PHASE (0.0 - 0.35)
                    const entryProgress = relativeStage / ENTRY_END;
                    unit.style.opacity = entryProgress;
                    unit.style.transform = `translateY(${(1 - entryProgress) * 100}px)`;
                    unit.style.visibility = 'visible';
                    unit.style.zIndex = 2;
                }
                else if (relativeStage >= ACTIVE_START && relativeStage <= ACTIVE_END) {
                    // ACTIVE PHASE (0.35 - 0.65) - Fully visible
                    unit.style.opacity = 1;
                    unit.style.transform = 'translateY(0)';
                    unit.style.visibility = 'visible';
                    unit.style.zIndex = 2;
                }
                else if (relativeStage > EXIT_START) {
                    // EXITING PHASE (0.65 - 1.0)
                    const exitProgress = (relativeStage - EXIT_START) / (1.0 - EXIT_START);
                    unit.style.opacity = 1 - exitProgress;
                    unit.style.transform = `translateY(${-exitProgress * 100}px)`;
                    unit.style.visibility = 'visible';
                    unit.style.zIndex = 1;
                }
            }
            // Keep the LAST feature visible at the end of the scroll
            else if (i === numItems - 1 && currentStage >= featureStageEnd) {
                unit.style.opacity = 1;
                unit.style.transform = 'translateY(0)';
                unit.style.visibility = 'visible';
                unit.style.zIndex = 2;
            }
        });
    };

    window.addEventListener('scroll', updateFeatures);
    updateFeatures(); // Initial call

    // Smooth scroll for nav links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });

    // Cursor Edge-Based Carousel Scrolling
    const carouselTrack = document.querySelector('.carousel-track');
    const carouselContainer = document.querySelector('.carousel-track-container');

    if (carouselTrack && carouselContainer) {
        let scrollInterval = null;
        const scrollSpeed = 5; // Pixels per frame
        const edgeZone = 100; // Pixels from edge to trigger scrolling

        const handleMouseMove = (e) => {
            const rect = carouselContainer.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const containerWidth = rect.width;

            // Clear any existing scroll
            if (scrollInterval) {
                cancelAnimationFrame(scrollInterval);
                scrollInterval = null;
            }

            // Check if cursor is in left edge zone
            if (mouseX < edgeZone && carouselTrack.scrollLeft > 0) {
                const scrollLeft = () => {
                    carouselTrack.scrollLeft -= scrollSpeed;
                    if (carouselTrack.scrollLeft > 0) {
                        scrollInterval = requestAnimationFrame(scrollLeft);
                    }
                };
                scrollInterval = requestAnimationFrame(scrollLeft);
            }
            // Check if cursor is in right edge zone
            else if (mouseX > containerWidth - edgeZone) {
                const maxScroll = carouselTrack.scrollWidth - carouselTrack.clientWidth;
                const scrollRight = () => {
                    carouselTrack.scrollLeft += scrollSpeed;
                    if (carouselTrack.scrollLeft < maxScroll) {
                        scrollInterval = requestAnimationFrame(scrollRight);
                    }
                };
                scrollInterval = requestAnimationFrame(scrollRight);
            }
        };

        const handleMouseLeave = () => {
            if (scrollInterval) {
                cancelAnimationFrame(scrollInterval);
                scrollInterval = null;
            }
        };

        carouselContainer.addEventListener('mousemove', handleMouseMove);
        carouselContainer.addEventListener('mouseleave', handleMouseLeave);
    }

    // Media Gallery Logic
    const mainImage = document.getElementById('gallery-main');
    const thumbnails = document.querySelectorAll('.thumbnail');

    thumbnails.forEach(thumb => {
        thumb.addEventListener('click', () => {
            // Instant update
            mainImage.src = thumb.src;

            // Update active state
            thumbnails.forEach(t => t.classList.remove('active'));
            thumb.classList.add('active');
        });
    });
});
