using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using OpenQA.Selenium;
using System.Collections.ObjectModel;
using Weavver.Testing.App;

namespace Weavver.Testing.Communication
{
     //[TestFixture]
     public partial class Chat : WeavverTest
     {
//-------------------------------------------------------------------------------------------
          [StagingTest]
          public void Run()
          {
               WeavverApp weavver = new WeavverApp();

               webDriver.Navigate().GoToUrl(BaseURL + "/Logistics_Products/Showcase.aspx");
               WaitForPageLoad();

               ClickButton(By.Id("saleschat"));


               IWebDriver popupDriver = null;

               ReadOnlyCollection<String> windowIterator = webDriver.WindowHandles;
               foreach (string windowHandle in windowIterator)
               {
                    popupDriver = webDriver.SwitchTo().Window(windowHandle);
                    if (popupDriver.Title == "Weavver Chat")
                    {
                         break;
                    }
               }

               WeavverTest popup = new WeavverTest();
               popup.webDriver = popupDriver;

               popup.SetControlValue(By.Id("UserName"), "Jane Doe");
               popup.SetControlValue(By.Id("EmailAddress"), "testing@weavver.com");
               popup.SetControlValue(By.Id("PhoneNumber"), "714-555-1212");
               popup.SetControlValue(By.Id("PhoneNumber"), "714-555-1212");
               FindElement(By.Id("Department_0")).Click();
               popup.SetControlValue(By.Id("Inquiry"), "I have some questions about your chat products...");

               popup.ClickButton(By.Id("submit"));

               
               WaitForTextExists2("#status", "connected");


               popup.ClickButton(By.Id("EndChat"));

               WaitForTextExists(By.Id("thankyou"), "Thank you for contacting us");
          }
//-------------------------------------------------------------------------------------------
     }
}