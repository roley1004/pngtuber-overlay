import { useState, useEffect, useRef } from 'react';
import { compressImage } from '../utils/imageHelpers';

export function usePNGTuber({ isAvatarOverlay, isTalking, isSimulating }) {
  const [fileError, setFileError] = useState('');
  const [isBlinking, setIsBlinking] = useState(false);
  const [previewBg, setPreviewBg] = useState('grid');
  
  const [selectedMic, setSelectedMic] = useState(localStorage.getItem('obs-pngtuber-mic') || '');
  const [sensitivity, setSensitivity] = useState(parseFloat(localStorage.getItem('obs-pngtuber-sens')) || 25);
  const [blinkFrequency, setBlinkFrequency] = useState(parseFloat(localStorage.getItem('obs-pngtuber-blink-freq')) || 4.0);
  const [isRandomBlink, setIsRandomBlink] = useState(localStorage.getItem('obs-pngtuber-random-blink') === 'true');
  const [bounceIntensity, setBounceIntensity] = useState(parseInt(localStorage.getItem('obs-pngtuber-bounce')) || 75);

  const [images, setImages] = useState({
    idle: localStorage.getItem('obs-pngtuber-img-idle') || null,
    talk: localStorage.getItem('obs-pngtuber-img-talk') || null,
    blink: localStorage.getItem('obs-pngtuber-img-blink') || null,
    talkBlink: localStorage.getItem('obs-pngtuber-img-talkBlink') || null
  });

  const micRef = useRef(selectedMic);
  const sensRef = useRef(sensitivity);

  useEffect(() => { micRef.current = selectedMic; localStorage.setItem('obs-pngtuber-mic', selectedMic) }, [selectedMic]);
  useEffect(() => { sensRef.current = sensitivity; localStorage.setItem('obs-pngtuber-sens', sensitivity) }, [sensitivity]);
  useEffect(() => { localStorage.setItem('obs-pngtuber-blink-freq', blinkFrequency) }, [blinkFrequency]);
  useEffect(() => { localStorage.setItem('obs-pngtuber-random-blink', isRandomBlink) }, [isRandomBlink]);
  useEffect(() => { localStorage.setItem('obs-pngtuber-bounce', bounceIntensity) }, [bounceIntensity]);

  useEffect(() => {
    let timeoutId;
    const scheduleBlink = () => {
      setIsBlinking(true); setTimeout(() => setIsBlinking(false), 150);
      const nextDelay = isRandomBlink ? (Math.random() * 4 + 2) * 1000 : blinkFrequency * 1000;
      timeoutId = setTimeout(scheduleBlink, nextDelay);
    };
    timeoutId = setTimeout(scheduleBlink, isRandomBlink ? (Math.random() * 4 + 2) * 1000 : blinkFrequency * 1000);
    return () => clearTimeout(timeoutId);
  }, [blinkFrequency, isRandomBlink]);

  const handleImageUpload = async (key, event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const compressedBase64 = await compressImage(file);
      setFileError('');
      setImages(prev => ({ ...prev, [key]: compressedBase64 }));
      if (!isAvatarOverlay) localStorage.setItem(`obs-pngtuber-img-${key}`, compressedBase64);
    } catch (errorMsg) {
      setFileError(errorMsg);
      setTimeout(() => setFileError(''), 4000);
    }
  };

  const getCurrentImage = () => {
    const isActive = isTalking || isSimulating;
    if (isActive && isBlinking) return images.talkBlink || images.talk || images.idle || '/idle.png';
    if (isActive && !isBlinking) return images.talk || images.idle || '/idle.png';
    if (!isActive && isBlinking) return images.blink || images.idle || '/idle.png';
    return images.idle || '/idle.png';
  };

  return {
    fileError, previewBg, setPreviewBg,
    selectedMic, setSelectedMic, sensitivity, setSensitivity,
    blinkFrequency, setBlinkFrequency, isRandomBlink, setIsRandomBlink,
    bounceIntensity, setBounceIntensity, images, setImages,
    micRef, sensRef, handleImageUpload, getCurrentImage
  };
}