'use strict';

import './popup.css';

(function () {
  function onWindowLoad() {
    var message = document.querySelector('#message');

    chrome.tabs
      .query({ active: true, currentWindow: true })
      .then(function (tabs) {
        var activeTab = tabs[0];
        var activeTabId = activeTab.id;

        return chrome.scripting.executeScript({
          target: { tabId: activeTabId },
          // injectImmediately: true,  // uncomment this to make it execute straight away, other wise it will wait for document_idle
          func: DOMtoString,
          // args: ['body']  // you can use this to target what element to get the html for
        });
      })
      .then(function (results) {
        message.innerText = results[0].result;
      })
      .catch(function (error) {
        message.innerText =
          'There was an error injecting script : \n' + error.message;
      });
  }

  window.onload = onWindowLoad;

  function DOMtoString(selector) {
    if (selector) {
      selector = document.querySelector(selector);
      if (!selector) return 'ERROR: querySelector failed to find node';
    } else {
      selector = document.documentElement;
    }

    if (CheckHTMLForCaptcha(selector.outerHTML)) {
      return selector.outerHTML;
    } else {
      return 'Not a captcha';
    }
  }

  function CheckHTMLForCaptcha(text) {
    if (String(text).indexOf('captcha-form') == -1) {
      return false;
    }
    return true;
  }

  function SolveAudioCaptcha() {
    model = Speech2TextForConditionalGeneration.from_pretrained(
      'facebook/s2t-small-librispeech-asr'
    );
    processor = Speech2TextProcessor.from_pretrained(
      'facebook/s2t-small-librispeech-asr'
    );

    ds = load_dataset(
      'hf-internal-testing/librispeech_asr_demo',
      'clean',
      (split = 'validation')
    );

    inputs = processor(
      ds[0]['audio']['array'],
      (sampling_rate = ds[0]['audio']['sampling_rate']),
      (return_tensors = 'pt')
    );
    generated_ids = model.generate(
      inputs['input_features'],
      (attention_mask = inputs['attention_mask'])
    );

    transcription = processor.batch_decode(
      generated_ids,
      (skip_special_tokens = True)
    );
    return transcription;
  }
})();
