"use client";
import React, { useState } from "react";
import Image from "next/image";
import "./landing.css"; // Ensure standard normal CSS is imported
import LoginModal from "../components/loginPopup"
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export default function LandingPage() {
  const [open, setOpen] = useState(false);
  const [isCalendarAnimating, setIsCalendarAnimating] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(0);
  const [showLogin, setShowLogin] = useState(false);
  const router = useRouter();
  const { data: session } = useSession();

  const handleCalendarClick = () => {
    setIsCalendarAnimating(true);
    setTimeout(() => {
      setIsCalendarAnimating(false);
    }, 1000);
  };

  return (
    <div className="landing-page">
      {/* Top Banner and Hero */}
      <div className="white-container">
        <nav className="navbar">
          <div className="logo">FFCS</div>
          {session ? (
            <div className="flex items-center gap-3">
              {session.user?.image && (
                <img src={session.user.image} alt="avatar" className="w-8 h-8 rounded-full" />
              )}
              <span className="font-semibold text-black pr-8">{session.user?.name}</span>
            </div>
          ) : (
            <button className="login-btn" onClick={() => setShowLogin(true)}>Login</button>
          )}
        </nav>
        {showLogin && (
          <LoginModal onClose={() => setShowLogin(false)} />
        )}

        <section className="hero-section">
          <div className="hero-text">
            <h1>Build Your<br />Timetable</h1>
            <p>
              Lorem Ipsum Dolor Sit Amet, Consectetur<br />
              Adipiscing Elit, Sed Do Eiusmod Tempor
            </p>
            <div className="hero-buttons">
              <button className="btn-primary" onClick={() => setOpen(true)}>Get Started</button>
              {open && (
                <div className="fixed inset-0 flex items-center justify-center bg-black/30 z-50">
                  <div className="flex items-center justify-center w-[949px] h-[511px] bg-[#FFFCEE] rounded-[20px] shadow-xl p-8 relative">
                    <div className="relative bg-[#FAFAFA] w-[900px] h-[459px] flex flex-col items-center rounded-[20px] p-10 shadow-[4px_4px_4px_rgba(191,191,191,0.25)]">
                      <button onClick={() => setOpen(false)} className="absolute top-6 right-6 text-gray-500 hover:text-black text-[28px]">✕</button>
                      <h2 className="text-[32px] font-semibold text-center mb-2 absolute top-[50px]">
                        Welcome {session?.user?.name ? `back, ${session.user.name}` : "to FFCS"}!
                      </h2>
                      <div className="w-[700px] h-[1px] bg-gray-300 mb-4 absolute top-[90px]"></div>
                      <p className="text-center text-[20px] mb-12 absolute top-[110px]">Choose what you&apos;d like to do next</p>
                      <div className="flex gap-14 absolute top-[180px]">
                        <button className="flex flex-col items-center justify-center bg-[#E9F3E8] border-[5px] border-[#D4F4E6] rounded-[16px] p-6 w-[290px] h-[200px] shadow hover:bg-green-200 transition text-black" onClick={() => { setOpen(false); router.push('/preferences'); }}>
                          <Image src="/create_new.png" alt="create" width={167} height={101} />
                          <p className="font-medium text-center">Create a new one</p>
                        </button>
                        <button className="flex flex-col items-center justify-center bg-[#E9D5FF] border-[#F2D8FE] border-[5px] rounded-[16px] p-6 w-[290px] h-[200px] shadow hover:bg-purple-300 transition text-black" onClick={() => { setOpen(false); router.push("/saved"); }}>
                          <Image src="/savedTimetable.png" alt="saved" width={167} height={101} unoptimized />
                          <p className="mt-4 font-medium text-center">View saved timetables</p>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <button className="btn-secondary" onClick={() => router.push('/slots')}>Slot View</button>
            </div>
          </div>
          <div className="hero-graphic">
            {/* Calendar pure CSS drawing */}
            <div className={`calendar-graphic ${isCalendarAnimating ? 'cal-fade-animation' : ''}`} onClick={handleCalendarClick} style={{ cursor: 'pointer' }}>
              <div className="cal-top">
                <div className="cal-tab" style={{ background: '#fbcfe8' }}></div>
                <div className="cal-tab" style={{ background: '#bfdbfe' }}></div>
                <div className="cal-tab" style={{ background: '#a7f3d0' }}></div>
                <div className="cal-tab" style={{ background: '#fde047' }}></div>
                <div className="cal-tab" style={{ background: '#c4b5fd' }}></div>
                <div className="cal-tab" style={{ background: '#bbf7d0' }}></div>
                <div className="cal-tab" style={{ background: '#fbcfe8' }}></div>
              </div>
              <div className="cal-grid">
                <div className="cal-box" style={{ background: '#93c5fd' }}></div>
                <div className="cal-box" style={{ background: '#fde047' }}></div>
                <div className="cal-box" style={{ background: '#bbf7d0' }}></div>
                <div className="cal-box" style={{ background: '#f3e8ff' }}></div>
                <div className="cal-box" style={{ background: '#fde047' }}></div>
                <div className="cal-box" style={{ background: '#fbcfe8' }}></div>

                <div className="cal-box" style={{ background: '#93c5fd' }}></div>
                <div className="cal-box" style={{ background: '#bbf7d0' }}></div>
                <div className="cal-box" style={{ background: '#fde047' }}></div>
                <div className="cal-box" style={{ background: '#bbf7d0' }}></div>
                <div className="cal-box" style={{ background: '#c4b5fd' }}></div>
                <div className="cal-box" style={{ background: '#fde047' }}></div>

                <div className="cal-box" style={{ background: '#93c5fd' }}></div>
                <div className="cal-box" style={{ background: '#bbf7d0' }}></div>
                <div className="cal-box" style={{ background: '#fde047' }}></div>
                <div className="cal-box" style={{ background: '#bbf7d0' }}></div>
                <div className="cal-box" style={{ background: '#c4b5fd' }}></div>
                <div className="cal-box" style={{ background: '#93c5fd' }}></div>

                <div className="cal-box" style={{ background: '#d8b4e2' }}></div>
                <div className="cal-box" style={{ background: '#fde047' }}></div>
                <div className="cal-box" style={{ background: '#bbf7d0' }}></div>
                <div className="cal-box" style={{ background: '#c4b5fd' }}></div>
                <div className="cal-box" style={{ background: '#bbf7d0' }}></div>
                <div className="cal-box" style={{ background: '#fde047' }}></div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Middle Sections */}
      <div className="middle-section">
        {/* How It Works */}
        <div className="how-it-works-card">
          <h2>How This Site Works?</h2>

          <div className="video-box">
            <Image src="/section1-preview.png" alt="Demo" fill />
            <div className="play-icon"></div>
          </div>

          <div className="steps-list">
            <div className="step-item">
              <div className="step-number">1</div>
              <p className="step-text">
                Lorem ipsum dolor sit amet consectetur. Porttitor eu cursus arcu viverra eros at a sed dignissim. Nibh amet at nibh pulvinar accumsan at quisque orci.
              </p>
            </div>
            <div className="step-item">
              <div className="step-number">2</div>
              <p className="step-text">
                Lorem ipsum dolor sit amet consectetur. Porttitor eu cursus arcu viverra eros at a sed dignissim. Nibh amet at nibh pulvinar accumsan at quisque orci.
              </p>
            </div>
            <div className="step-item">
              <div className="step-number">3</div>
              <p className="step-text">
                Lorem ipsum dolor sit amet consectetur. Porttitor eu cursus arcu viverra eros at a sed dignissim. Nibh amet at nibh pulvinar accumsan at quisque orci.
              </p>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="faq-card">
          <h2>Frequently asked questions:</h2>
          <div className="faq-list">
            {[
              {
                q: "Why to use this site?",
                a: "Lorem ipsum dolor sit amet consectetur. Sed vitae proin enim amet consequat sit. Lorem convallis imperdiet at quis feugiat est dignissim in mi. A odio purus feugiat volutpat tellus felis amet vulputate urna."
              },
              {
                q: "Will it help me in my\nFFCS",
                a: "Yes, it helps you organize and plan your timetable seamlessly before the actual FFCS process begins."
              },
              {
                q: "Do I need to be a VIT student to use\nthis site?",
                a: "This tool is specifically designed for the FFCS system at VIT. However, anyone can try it out!"
              },
              {
                q: "Lorem ipsum dolor sit amet\nconsectetur.",
                a: "Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam."
              }
            ].map((faq, index) => (
              <div
                key={index}
                className="faq-item"
                style={activeFaq === index ? { background: 'transparent', transition: 'background 0.3s ease' } : { cursor: 'pointer', transition: 'background 0.3s ease' }}
              >
                <div className="faq-question" onClick={() => setActiveFaq(activeFaq === index ? null : index)}>
                  <span>{faq.q.split('\n').map((line, i) => <React.Fragment key={i}>{line}{i === 0 && faq.q.includes('\n') ? <br /> : null}</React.Fragment>)}</span>
                  <span className="faq-icon" style={{ transform: activeFaq === index ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.4s ease' }}>⌄</span>
                </div>
                <div
                  style={{
                    maxHeight: activeFaq === index ? '200px' : '0px',
                    opacity: activeFaq === index ? 1 : 0,
                    overflow: 'hidden',
                    transition: 'all 0.4s ease-in-out'
                  }}
                >
                  <div className="faq-answer">
                    {faq.a}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="footer-container">
        <div className="footer-top">
          <div className="binding-rings">
            <div className="ring" style={{ background: '#fbcfe8' }}></div>
            <div className="ring" style={{ background: '#bfdbfe' }}></div>
            <div className="ring" style={{ background: '#a7f3d0' }}></div>
            <div className="ring" style={{ background: '#fde047' }}></div>
            <div className="ring" style={{ background: '#c4b5fd' }}></div>
            <div className="ring" style={{ background: '#bbf7d0' }}></div>
            <div className="ring" style={{ background: '#fbcfe8' }}></div>
          </div>
        </div>

        <div className="footer-main">
          <div className="footer-grid">
            <div className="f-block f-about">
              <h3>FFCS</h3>
              <p>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Etiam eu turpis molestie, dictum est a, mattis tellus. Sed dignissim, metus nec fringilla accumsan, risus sem sollicitudin lacus, ut interdum tellus elit sed risus.
              </p>
            </div>

            <div className="f-block f-buttons">
              <button className="f-btn f-btn-gen" onClick={() => router.push('/preferences')}>
                <Image src="/calendar_icon2.png" alt="calendar" width={32} height={32} />
                <span>Generate<br />timetable</span>
              </button>
              <button className="f-btn f-btn-saved" onClick={() => router.push('/saved')}>
                <Image src="/Clock.png" alt="clock" width={32} height={32} />
                <span>View saved<br />timetables</span>
              </button>
              <button className="f-btn f-btn-slots" onClick={() => router.push('/slots')}>
                <Image src="/slot_icon.png" alt="slot" width={32} height={32} />
                <span>View slots</span>
              </button>
              <button className="f-btn f-btn-team">
                <Image src="/team_icon.png" alt="team" width={32} height={32} />
                <span>View team</span>
              </button>
            </div>

            <div className="f-block f-graphics">
              <div className="floating-tile" style={{ background: '#f3e8ff', top: '15px', left: '15px', transform: 'rotate(-12deg)' }}>C</div>
              <div className="floating-tile" style={{ background: '#fef3c7', top: '55px', left: '45px', transform: 'rotate(8deg)' }}>D</div>
              <div className="floating-tile" style={{ background: '#d1fae5', top: '20px', left: '75px', transform: 'rotate(15deg)' }}>G</div>
              <div className="floating-tile" style={{ background: '#a7f3d0', top: '30px', right: '25px', transform: 'rotate(25deg)' }}>E</div>
              <div className="floating-tile" style={{ background: '#bfdbfe', top: '65px', right: '65px', transform: 'rotate(-18deg)' }}>B</div>
              <div className="floating-tile" style={{ background: '#fef08a', top: '85px', right: '15px', transform: 'rotate(-6deg)' }}>A</div>
              <div className="floating-tile" style={{ background: '#e9d5ff', top: '95px', left: '110px', transform: 'rotate(22deg)' }}>F</div>
            </div>

            <div className="f-block f-credits">
              Built with ❤️ by Microsoft Innovations Club
            </div>

            <div className="f-block f-updates">
              <input type="text" placeholder="Get updates" />
              <button>
                <Image src="/Vector.png" alt="bell" width={16} height={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
